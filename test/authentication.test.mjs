import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import loginHandler from "../api/auth/login.js";
import logoutHandler from "../api/auth/logout.js";
import sessionHandler from "../api/auth/session.js";
import stateHandler from "../api/state.js";
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  verifyCredentials,
  verifySessionToken
} from "../lib/auth.js";

process.env.ADMIN_USERNAME = "responsavel.scir";
process.env.ADMIN_PASSWORD = "senha-segura-exclusiva-de-teste";
process.env.SESSION_SECRET = "segredo-de-sessao-com-mais-de-32-caracteres";

function responseRecorder(){
  return {
    statusCode:0,
    headers:{},
    body:"",
    setHeader(name,value){ this.headers[String(name).toLowerCase()] = value; },
    end(body){ this.body = body || ""; }
  };
}

function request(method,{body,headers={}}={}){
  return {method,body,headers,socket:{remoteAddress:"127.0.0.1"}};
}

function cookieHeaderFrom(response){
  return String(response.headers["set-cookie"] || "").split(";")[0];
}

test("valida somente o único usuário configurado",() => {
  assert.equal(verifyCredentials("RESPONSAVEL.SCIR","senha-segura-exclusiva-de-teste").ok,true);
  assert.equal(verifyCredentials("outro.usuario","senha-segura-exclusiva-de-teste").ok,false);
  assert.equal(verifyCredentials("responsavel.scir","senha-incorreta").ok,false);
});

test("assina a sessão por 24 horas e rejeita adulteração ou expiração",() => {
  const startedAt = Date.UTC(2026,9,27,12,0,0);
  const token = createSessionToken(process.env.ADMIN_USERNAME,startedAt);
  const session = verifySessionToken(token,startedAt + 1000);
  assert.equal(session.username,"responsavel.scir");
  assert.equal(session.expiresAt - session.issuedAt,SESSION_MAX_AGE_SECONDS);
  assert.equal(verifySessionToken(`${token}alterado`,startedAt + 1000),null);
  assert.equal(verifySessionToken(token,startedAt + (SESSION_MAX_AGE_SECONDS * 1000)),null);
});

test("trocar a senha configurada invalida as sessões anteriores",() => {
  const originalPassword = process.env.ADMIN_PASSWORD;
  const token = createSessionToken(process.env.ADMIN_USERNAME);
  process.env.ADMIN_PASSWORD = "nova-senha-segura-de-teste";
  try{
    assert.equal(verifySessionToken(token),null);
  }finally{
    process.env.ADMIN_PASSWORD = originalPassword;
  }
});

test("login cria cookie protegido e a rota de sessão reconhece o usuário",async () => {
  const loginResponse = responseRecorder();
  await loginHandler(request("POST",{
    body:{username:"responsavel.scir",password:"senha-segura-exclusiva-de-teste"},
    headers:{"x-forwarded-proto":"https","x-forwarded-for":"127.0.0.2"}
  }),loginResponse);
  assert.equal(loginResponse.statusCode,200);
  assert.match(loginResponse.headers["set-cookie"],new RegExp(`^${SESSION_COOKIE_NAME}=`));
  assert.match(loginResponse.headers["set-cookie"],/HttpOnly/);
  assert.match(loginResponse.headers["set-cookie"],/SameSite=Strict/);
  assert.match(loginResponse.headers["set-cookie"],/Secure/);
  assert.match(loginResponse.headers["set-cookie"],/Max-Age=86400/);

  const sessionResponse = responseRecorder();
  await sessionHandler(request("GET",{headers:{cookie:cookieHeaderFrom(loginResponse)}}),sessionResponse);
  assert.equal(sessionResponse.statusCode,200);
  assert.deepEqual(JSON.parse(sessionResponse.body).user,{username:"responsavel.scir"});
});

test("credencial inválida não cria cookie e devolve mensagem genérica",async () => {
  const response = responseRecorder();
  await loginHandler(request("POST",{
    body:{username:"responsavel.scir",password:"incorreta"},
    headers:{"x-forwarded-for":"127.0.0.3"}
  }),response);
  assert.equal(response.statusCode,401);
  assert.equal(response.headers["set-cookie"],undefined);
  assert.equal(JSON.parse(response.body).error,"Usuário ou senha inválidos.");
});

test("APIs operacionais recusam requisição sem sessão antes de acessar a base",async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => { throw new Error("a base não deveria ser consultada"); };
  try{
    const response = responseRecorder();
    await stateHandler(request("GET"),response);
    assert.equal(response.statusCode,401);
    assert.equal(JSON.parse(response.body).code,"AUTH_REQUIRED");
  }finally{
    global.fetch = originalFetch;
  }
});

test("logout expira o cookie sem alterar qualquer dado",async () => {
  const response = responseRecorder();
  await logoutHandler(request("POST",{headers:{"x-forwarded-proto":"https"}}),response);
  assert.equal(response.statusCode,200);
  assert.match(response.headers["set-cookie"],new RegExp(`^${SESSION_COOKIE_NAME}=`));
  assert.match(response.headers["set-cookie"],/Max-Age=0/);
  assert.match(response.headers["set-cookie"],/HttpOnly/);
});

test("interface começa bloqueada e só inicializa a nuvem após validar a sessão",() => {
  const html = fs.readFileSync(new URL("../index.html",import.meta.url),"utf8");
  assert.match(html,/<body class="auth-pending">/);
  assert.match(html,/id="loginScreen"/);
  assert.match(html,/id="logoutButton"/);
  assert.match(html,/checkAuthenticatedSession\(\);\s*<\/script>/);
  assert.match(html,/if\(!isAuthenticated\) return;\s*setCloudStatus\("Conectando à base…"\)/);
  assert.match(html,/response\.status === 401[\s\S]*?lockExpiredSession\(\)/);
  assert.doesNotMatch(html,/renderAll\(\);\s*ensureCurrentRequestTime\(\);\s*loadCloudState\(\);\s*<\/script>/);
});
