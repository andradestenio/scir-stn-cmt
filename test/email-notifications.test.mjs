import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import listHandler from "../api/email-notifications.js";
import statusHandler from "../api/email-notification-status.js";
import {
  decryptEmailPassword,
  encryptEmailPassword
} from "../lib/email-credentials.js";
import {
  configureZimbra,
  messageToNotification,
  syncZimbraNotifications
} from "../lib/zimbra.js";

process.env.SUPABASE_URL = "https://example.supabase.co";
process.env.SUPABASE_SECRET_KEY = "supabase-secret";
process.env.SESSION_SECRET = "12345678901234567890123456789012";

test("abre diretamente sem formulário de login ou ação de sair", () => {
  const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
  assert.doesNotMatch(html, /id="loginScreen"/);
  assert.doesNotMatch(html, /id="loginForm"/);
  assert.doesNotMatch(html, /id="logoutButton"/);
  assert.doesNotMatch(html, /\/api\/login/);
  assert.doesNotMatch(html, /\/api\/logout/);
  assert.match(html, /nirCemetronRecoveryStateV1/);
  assert.match(html, /Dados locais protegidos/);
  assert.match(html, /setTimeout\(queueCloudSave, 15000\)/);
  assert.match(html, /id="restoreLocalRecovery"/);
  assert.match(html, /const localMustBePreserved = stateHasOperationalData\(state\)/);
  assert.match(html, /localSavedAt > remoteUpdatedAt \+ 1000/);
  assert.match(html, /id="syncDiagnostic"/);
  assert.match(html, /id="testCloudSync"/);
  assert.match(html, /scir-nir-cemetron-backup/);
  assert.match(html, /backup_scir_antes_importacao/);
  assert.doesNotMatch(html, /1iRZoOjgvfqfpR_ImLDd6KnYzxULIWsBl/);
  assert.match(html, /<button data-view="consultarEscalas">/);
  assert.match(html, /<span class="nav-label">Consultar escalas<\/span>/);
  assert.match(html, /<section id="consultarEscalas" class="view hidden">/);
  assert.match(html, /id="scaleLinkName"/);
  assert.match(html, /id="scaleLinkReference"/);
  assert.match(html, /id="scaleLinkUrl"/);
  assert.match(html, /id="saveScaleLink"/);
  assert.match(html, /id="scaleLinksList"/);
  assert.match(html, /state\.scaleLinks = normalizeScaleLinks\(state\.scaleLinks\)/);
  assert.match(html, /Abrir escala<\/a>/);
  assert.match(html, /<button data-view="estatisticas">/);
  assert.match(html, /<section id="estatisticas" class="view hidden">/);
  assert.match(html, /id="statisticsStartDate"/);
  assert.match(html, /id="statisticsEndDate"/);
  assert.match(html, /id="statisticsShiftType"/);
  assert.match(html, /id="statisticsProfessional"/);
  assert.match(html, /id="statisticsModule"/);
  assert.match(html, /id="statisticsOrigin"/);
  assert.match(html, /id="statisticsDestination"/);
  assert.match(html, /id="statisticsSearch"/);
  assert.match(html, /function buildStatisticsData\(\)/);
  assert.match(html, /function exportStatisticsExcel\(\)/);
  assert.match(html, /state\.history\s*\.filter\(item => item\?\.shift\?\.status === "ENCERRADO"\)/);
  assert.doesNotMatch(html, /id="authorizationNavButton"/);
  assert.doesNotMatch(html, /id="autorizacaoTransferencia"/);
  assert.doesNotMatch(html, /openAuthorization\(/);
  assert.match(html, /id="origin" list="originOptions"/);
  assert.match(html, /<option value="HEPSJPII"><\/option>/);
  assert.match(html, /<option value="PA José Adelino"><\/option>/);
  assert.match(html, /id="destination" list="destinationOptions"/);
  assert.match(html, /id="destinationOptions"/);
  assert.match(html, /<option value="CEMETRON > Pronto Atendimento"><\/option>/);
  assert.match(html, /<option value="CEMETRON > UTI Infectologia"><\/option>/);
  assert.match(html, /<option value="CEMETRON > UTI Clínica"><\/option>/);
  assert.match(html, /<option value="CEMETRON > CMM1"><\/option>/);
  assert.match(html, /<option value="CEMETRON > CMM2"><\/option>/);
  assert.match(html, /<option value="CEMETRON > CMM3"><\/option>/);
  assert.match(html, /<option value="CEMETRON > CMF"><\/option>/);
  assert.match(html, /<option value="CEMETRON > Isolamento"><\/option>/);
  assert.doesNotMatch(html, /id="authorizationWard"/);
  assert.doesNotMatch(html, /id="authorizationBed"/);
  assert.match(html, /id="authorizationWardBed"/);
  assert.match(html, /Enfermaria\/Leito/);
  assert.doesNotMatch(html, /destination\.removeAttribute\("list"\)/);
  assert.match(html, /function recordDestinationText\(record\)/);
  assert.ok(
    html.indexOf('<div class="panel data-security-panel">') > html.indexOf('<div class="panel bed-census-panel">'),
    "a área de segurança deve aparecer depois do censo diário"
  );
});

function responseRecorder(){
  return {
    statusCode:0,
    headers:{},
    body:"",
    setHeader(name, value){ this.headers[name] = value; },
    end(body){ this.body = body || ""; }
  };
}

test("interface inclui ciência em roxo e produtividade no histórico do plantão", () => {
  const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /data-email-action="acknowledged"/);
  assert.match(html, /data-email-status-editor/);
  assert.match(html, /<option value="pending"/);
  assert.match(html, /<option value="read"/);
  assert.match(html, /<option value="responded"/);
  assert.match(html, /<option value="acknowledged"/);
  assert.match(html, /Ciente 👍🏻/);
  assert.match(html, /\.email-status-tag\.acknowledged/);
  assert.match(html, /background:#f3e8ff/);
  assert.match(html, /emailSummary:buildEmailProductivitySummary\(\)/);
  assert.match(html, /censusUpdates:JSON\.parse\(JSON\.stringify\(state\.shiftCensusUpdates/);
  assert.match(html, /historyCensusHistoryBody/);
});

test("lista somente as notificações vinculadas ao plantão solicitado", async () => {
  const originalFetch = global.fetch;
  let requestNumber = 0;
  global.fetch = async () => {
    requestNumber += 1;
    if(requestNumber === 1) return new Response("[]", {status:200});
    return new Response(JSON.stringify([
      {
        state:{
          event_key:"message-1",
          shift_id:"plantao-atual",
          sender:"João Silva",
          subject:"Solicitação de avaliação",
          received_at:"2026-07-26T22:42:00.000Z",
          created_at:"2026-07-26T22:42:01.000Z"
        },
        updated_at:"2026-07-26T22:42:01.000Z"
      },
      {
        state:{
          event_key:"message-anterior",
          shift_id:"plantao-anterior",
          sender:"Maria",
          subject:"Mensagem do plantão anterior",
          received_at:"2026-07-25T22:42:00.000Z",
          created_at:"2026-07-25T22:42:01.000Z",
          responded_at:"2026-07-25T23:00:00.000Z"
        },
        updated_at:"2026-07-25T23:00:00.000Z"
      }
    ]), {status:200});
  };

  try{
    const req = {
      method:"GET",
      query:{historyShiftId:"plantao-atual"}
    };
    const res = responseRecorder();
    await listHandler(req, res);
    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.notifications.length, 1);
    assert.equal(body.historyShiftId, "plantao-atual");
    assert.deepEqual(body.notifications[0], {
      eventKey:"message-1",
      sender:"João Silva",
      subject:"Solicitação de avaliação",
      receivedAt:"2026-07-26T22:42:00.000Z",
      createdAt:"2026-07-26T22:42:01.000Z",
      readAt:null,
      respondedAt:null,
      acknowledgedAt:null
    });
  }finally{
    global.fetch = originalFetch;
  }
});

test("persiste a marcação de e-mail como lido", async () => {
  const originalFetch = global.fetch;
  let storedState;
  let requestNumber = 0;
  global.fetch = async (_url, options={}) => {
    requestNumber += 1;
    if(requestNumber === 1){
      return new Response(JSON.stringify([{
        state:{
          event_key:"message-1",
          shift_id:"plantao-atual",
          sender:"João Silva",
          subject:"Solicitação de avaliação",
          received_at:"2026-07-26T22:42:00.000Z",
          created_at:"2026-07-26T22:42:01.000Z"
        }
      }]), {status:200});
    }
    storedState = JSON.parse(options.body).state;
    return new Response(JSON.stringify([{state:storedState}]), {status:201});
  };

  try{
    const req = {
      method:"PUT",
      body:{eventKey:"message-1", action:"read"}
    };
    const res = responseRecorder();
    await statusHandler(req, res);
    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.deepEqual(body.eventKeys, ["message-1"]);
    assert.equal(body.action, "read");
    assert.ok(storedState.read_at);
    assert.equal(storedState.responded_at, null);
    assert.equal(storedState.acknowledged_at, null);
    assert.equal(storedState.event_key, "message-1");
    assert.equal(storedState.shift_id, "plantao-atual");
  }finally{
    global.fetch = originalFetch;
  }
});

test("evolui um e-mail lido para respondido", async () => {
  const originalFetch = global.fetch;
  let storedState;
  let requestNumber = 0;
  global.fetch = async (_url, options={}) => {
    requestNumber += 1;
    if(requestNumber === 1){
      return new Response(JSON.stringify([{
        state:{
          event_key:"message-2",
          shift_id:"plantao-atual",
          sender:"Maria",
          subject:"Avaliação",
          received_at:"2026-07-26T22:42:00.000Z",
          created_at:"2026-07-26T22:42:01.000Z",
          read_at:"2026-07-26T22:43:00.000Z"
        }
      }]), {status:200});
    }
    storedState = JSON.parse(options.body).state;
    return new Response(JSON.stringify([{state:storedState}]), {status:201});
  };

  try{
    const req = {
      method:"PUT",
      body:{eventKey:"message-2", action:"responded"}
    };
    const res = responseRecorder();
    await statusHandler(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(JSON.parse(res.body).action, "responded");
    assert.equal(storedState.read_at, "2026-07-26T22:43:00.000Z");
    assert.ok(storedState.responded_at);
    assert.equal(storedState.acknowledged_at, null);
    assert.equal(storedState.shift_id, "plantao-atual");
  }finally{
    global.fetch = originalFetch;
  }
});

test("permite editar um e-mail respondido para ciente", async () => {
  const originalFetch = global.fetch;
  let storedState;
  let requestNumber = 0;
  global.fetch = async (_url, options={}) => {
    requestNumber += 1;
    if(requestNumber === 1){
      return new Response(JSON.stringify([{
        state:{
          event_key:"message-ciente",
          shift_id:"plantao-atual",
          sender:"Direção",
          subject:"Comunicado",
            received_at:"2026-07-26T22:42:00.000Z",
            created_at:"2026-07-26T22:42:01.000Z",
            read_at:"2026-07-26T22:43:00.000Z",
            responded_at:"2026-07-26T22:50:00.000Z"
        }
      }]), {status:200});
    }
    storedState = JSON.parse(options.body).state;
    return new Response(JSON.stringify([{state:storedState}]), {status:201});
  };

  try{
    const req = {
      method:"PUT",
      body:{eventKey:"message-ciente", action:"acknowledged"}
    };
    const res = responseRecorder();
    await statusHandler(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(JSON.parse(res.body).action, "acknowledged");
    assert.equal(storedState.read_at, "2026-07-26T22:43:00.000Z");
    assert.ok(storedState.acknowledged_at);
    assert.equal(storedState.responded_at, null);
    assert.equal(storedState.shift_id, "plantao-atual");
  }finally{
    global.fetch = originalFetch;
  }
});

test("permite devolver um e-mail ciente para pendente", async () => {
  const originalFetch = global.fetch;
  let storedState;
  let requestNumber = 0;
  global.fetch = async (_url, options={}) => {
    requestNumber += 1;
    if(requestNumber === 1){
      return new Response(JSON.stringify([{
        state:{
          event_key:"message-reaberta",
          shift_id:"plantao-atual",
          sender:"Direção",
          subject:"Comunicado revisto",
          received_at:"2026-07-26T22:42:00.000Z",
          created_at:"2026-07-26T22:42:01.000Z",
          read_at:"2026-07-26T22:43:00.000Z",
          acknowledged_at:"2026-07-26T22:50:00.000Z"
        }
      }]), {status:200});
    }
    storedState = JSON.parse(options.body).state;
    return new Response(JSON.stringify([{state:storedState}]), {status:201});
  };

  try{
    const req = {
      method:"PUT",
      body:{eventKey:"message-reaberta", action:"pending"}
    };
    const res = responseRecorder();
    await statusHandler(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(JSON.parse(res.body).action, "pending");
    assert.equal(storedState.read_at, null);
    assert.equal(storedState.responded_at, null);
    assert.equal(storedState.acknowledged_at, null);
    assert.equal(storedState.shift_id, "plantao-atual");
  }finally{
    global.fetch = originalFetch;
  }
});

test("permite editar um e-mail finalizado para lido", async () => {
  const originalFetch = global.fetch;
  let storedState;
  let requestNumber = 0;
  global.fetch = async (_url, options={}) => {
    requestNumber += 1;
    if(requestNumber === 1){
      return new Response(JSON.stringify([{
        state:{
          event_key:"message-lida",
          shift_id:"plantao-atual",
          sender:"Direção",
          subject:"Avaliação em andamento",
          received_at:"2026-07-26T22:42:00.000Z",
          created_at:"2026-07-26T22:42:01.000Z",
          read_at:"2026-07-26T22:43:00.000Z",
          responded_at:"2026-07-26T22:50:00.000Z"
        }
      }]), {status:200});
    }
    storedState = JSON.parse(options.body).state;
    return new Response(JSON.stringify([{state:storedState}]), {status:201});
  };

  try{
    const req = {
      method:"PUT",
      body:{eventKey:"message-lida", action:"read"}
    };
    const res = responseRecorder();
    await statusHandler(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(JSON.parse(res.body).action, "read");
    assert.equal(storedState.read_at, "2026-07-26T22:43:00.000Z");
    assert.equal(storedState.responded_at, null);
    assert.equal(storedState.acknowledged_at, null);
  }finally{
    global.fetch = originalFetch;
  }
});

test("converte o envelope em metadados mínimos sem corpo ou anexos", () => {
  const notification = messageToNotification({
    uid:42,
    internalDate:new Date("2026-07-26T22:42:00.000Z"),
    envelope:{
      messageId:"message-2",
      from:[{name:"João\nSilva", address:"joao@example.org"}],
      subject:"Solicitação\r\nde avaliação"
    },
    body:"conteúdo que não deve ser persistido",
    attachments:["arquivo.pdf"]
  });
  assert.deepEqual(Object.keys(notification).sort(), [
    "event_key",
    "received_at",
    "sender",
    "subject"
  ]);
  assert.equal(notification.sender, "João Silva <joao@example.org>");
  assert.equal(notification.subject, "Solicitação de avaliação");
  assert.equal(JSON.stringify(notification).includes("conteúdo que não deve"), false);
  assert.equal(JSON.stringify(notification).includes("arquivo.pdf"), false);
});

test("protege a senha do Zimbra com criptografia autenticada", () => {
  const password = "senha-de-teste-nao-real";
  const encrypted = encryptEmailPassword(password);
  assert.notEqual(encrypted, password);
  assert.equal(encrypted.includes(password), false);
  assert.equal(decryptEmailPassword(encrypted), password);
});

test("testa a conexão e persiste a configuração sem senha em texto aberto", async () => {
  const originalFetch = global.fetch;
  let storedState;
  let testedPassword;
  global.fetch = async (_url, options) => {
    const body = JSON.parse(options.body);
    storedState = body.state;
    return new Response(JSON.stringify([{state:storedState}]), {status:201});
  };

  try{
    const result = await configureZimbra("senha-nao-real", {
      openMailboxImpl:async password => {
        testedPassword = password;
        return {
          client:{usable:true, logout:async () => {}},
          mailbox:{uidValidity:123n, uidNext:51n}
        };
      }
    });
    assert.equal(testedPassword, "senha-nao-real");
    assert.equal(storedState.username, "nr.cemetron@sesau.ro.gov.br");
    assert.equal(storedState.last_uid, 50);
    assert.equal(storedState.password_ciphertext.includes("senha-nao-real"), false);
    assert.equal(result.configured, true);
    assert.equal(result.connectionTested, true);
  }finally{
    global.fetch = originalFetch;
  }
});

test("ao iniciar novo plantão ignora e-mails do intervalo e mantém os posteriores ao início", async () => {
  const originalFetch = global.fetch;
  const integrationId = "nir-cemetron-email-integration";
  const stored = new Map([[
    integrationId,
    {
      host:"webmail.sesau.ro.gov.br",
      port:993,
      secure:true,
      username:"nr.cemetron@sesau.ro.gov.br",
      mailbox:"INBOX",
      password_ciphertext:encryptEmailPassword("senha-nao-real"),
      uid_validity:"123",
      last_uid:10,
      active_shift_id:"plantao-anterior",
      last_checked_at:"2026-07-26T10:00:00.000Z",
      last_error:null
    }
  ]]);

  global.fetch = async (url, options={}) => {
    const method = options.method || "GET";
    if(method === "GET"){
      const idMatch = String(url).match(/id=eq\.([^&]+)/);
      const id = idMatch ? decodeURIComponent(idMatch[1]) : "";
      const state = stored.get(id);
      return new Response(JSON.stringify(state ? [{state}] : []), {status:200});
    }
    const body = JSON.parse(options.body);
    stored.set(body.id, body.state);
    return new Response(JSON.stringify([{state:body.state}]), {status:201});
  };

  const messages = [
    {
      uid:11,
      internalDate:new Date("2026-07-26T11:55:00.000Z"),
      envelope:{messageId:"fora-do-plantao", from:[{address:"fora@example.org"}], subject:"Fora"}
    },
    {
      uid:12,
      internalDate:new Date("2026-07-26T12:05:00.000Z"),
      envelope:{messageId:"durante-o-plantao", from:[{address:"dentro@example.org"}], subject:"Dentro"}
    }
  ];
  const client = {
    usable:true,
    async *fetch(){ for(const message of messages) yield message; },
    logout:async () => {}
  };

  try{
    const result = await syncZimbraNotifications({
      force:true,
      shiftId:"plantao-atual",
      shiftStartedAt:"2026-07-26T12:00:00.000Z",
      openMailboxImpl:async () => ({
        client,
        mailbox:{uidValidity:123n, uidNext:13n}
      })
    });
    const integration = stored.get(integrationId);
    const notifications = [...stored.values()].filter(item => item.event_key);
    assert.equal(result.monitoringActive, true);
    assert.equal(integration.active_shift_id, "plantao-atual");
    assert.equal(integration.last_uid, 12);
    assert.deepEqual(notifications.map(item => item.event_key), ["durante-o-plantao"]);
    assert.equal(notifications[0].shift_id, "plantao-atual");
  }finally{
    global.fetch = originalFetch;
  }
});
