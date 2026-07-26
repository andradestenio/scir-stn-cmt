import test from "node:test";
import assert from "node:assert/strict";
import {createSessionCookie} from "../lib/auth.js";
import listHandler from "../api/email-notifications.js";
import {
  decryptEmailPassword,
  encryptEmailPassword
} from "../lib/email-credentials.js";
import {
  configureZimbra,
  messageToNotification
} from "../lib/zimbra.js";

process.env.SUPABASE_URL = "https://example.supabase.co";
process.env.SUPABASE_SECRET_KEY = "supabase-secret";
process.env.SESSION_SECRET = "12345678901234567890123456789012";

function responseRecorder(){
  return {
    statusCode:0,
    headers:{},
    body:"",
    setHeader(name, value){ this.headers[name] = value; },
    end(body){ this.body = body || ""; }
  };
}

test("lista notificações somente com sessão autenticada", async () => {
  const originalFetch = global.fetch;
  let requestNumber = 0;
  global.fetch = async () => {
    requestNumber += 1;
    if(requestNumber === 1) return new Response("[]", {status:200});
    return new Response(JSON.stringify([{
      state:{
        event_key:"message-1",
        sender:"João Silva",
        subject:"Solicitação de avaliação",
        received_at:"2026-07-26T22:42:00.000Z",
        created_at:"2026-07-26T22:42:01.000Z"
      },
      updated_at:"2026-07-26T22:42:01.000Z"
    }]), {status:200});
  };

  try{
    const req = {
      method:"GET",
      headers:{cookie:createSessionCookie().split(";")[0]}
    };
    const res = responseRecorder();
    await listHandler(req, res);
    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.deepEqual(body.notifications[0], {
      eventKey:"message-1",
      sender:"João Silva",
      subject:"Solicitação de avaliação",
      receivedAt:"2026-07-26T22:42:00.000Z",
      createdAt:"2026-07-26T22:42:01.000Z"
    });
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
