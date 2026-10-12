import test from "node:test";
import assert from "node:assert/strict";
import {getState} from "../lib/supabase.js";

test("envia chave sb_secret somente no cabeçalho apikey", async () => {
  const originalFetch = global.fetch;
  const originalUrl = process.env.SUPABASE_URL;
  const originalSecret = process.env.SUPABASE_SECRET_KEY;
  const originalServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  let receivedHeaders;

  process.env.SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SECRET_KEY = "sb_secret_teste_nao_real";
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  global.fetch = async (_url, options={}) => {
    receivedHeaders = options.headers;
    return new Response("[]", {status:200});
  };

  try{
    await getState();
    assert.equal(receivedHeaders.apikey, "sb_secret_teste_nao_real");
    assert.equal(receivedHeaders.Authorization, undefined);
  }finally{
    global.fetch = originalFetch;
    if(originalUrl === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = originalUrl;
    if(originalSecret === undefined) delete process.env.SUPABASE_SECRET_KEY;
    else process.env.SUPABASE_SECRET_KEY = originalSecret;
    if(originalServiceRole === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = originalServiceRole;
  }
});

test("mantém compatibilidade com chave service_role legada em JWT", async () => {
  const originalFetch = global.fetch;
  const originalUrl = process.env.SUPABASE_URL;
  const originalSecret = process.env.SUPABASE_SECRET_KEY;
  const originalServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  let receivedHeaders;
  const legacyKey = "eyJhbGciOiJIUzI1NiJ9.teste.assinatura";

  process.env.SUPABASE_URL = "https://example.supabase.co";
  delete process.env.SUPABASE_SECRET_KEY;
  process.env.SUPABASE_SERVICE_ROLE_KEY = legacyKey;
  global.fetch = async (_url, options={}) => {
    receivedHeaders = options.headers;
    return new Response("[]", {status:200});
  };

  try{
    await getState();
    assert.equal(receivedHeaders.apikey, legacyKey);
    assert.equal(receivedHeaders.Authorization, `Bearer ${legacyKey}`);
  }finally{
    global.fetch = originalFetch;
    if(originalUrl === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = originalUrl;
    if(originalSecret === undefined) delete process.env.SUPABASE_SECRET_KEY;
    else process.env.SUPABASE_SECRET_KEY = originalSecret;
    if(originalServiceRole === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = originalServiceRole;
  }
});

test("normaliza aspas, espaços e caminho REST das variáveis do Supabase", async () => {
  const originalFetch = global.fetch;
  const originalUrl = process.env.SUPABASE_URL;
  const originalSecret = process.env.SUPABASE_SECRET_KEY;
  let receivedUrl;
  let receivedHeaders;

  process.env.SUPABASE_URL = '  "https://example.supabase.co/rest/v1/"  ';
  process.env.SUPABASE_SECRET_KEY = '  "sb_secret_teste_normalizado"  ';
  global.fetch = async (url, options={}) => {
    receivedUrl = url;
    receivedHeaders = options.headers;
    return new Response("[]", {status:200});
  };

  try{
    await getState();
    assert.equal(receivedUrl, "https://example.supabase.co/rest/v1/app_state?id=eq.nir-cemetron-principal&select=state,updated_at");
    assert.equal(receivedHeaders.apikey, "sb_secret_teste_normalizado");
  }finally{
    global.fetch = originalFetch;
    if(originalUrl === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = originalUrl;
    if(originalSecret === undefined) delete process.env.SUPABASE_SECRET_KEY;
    else process.env.SUPABASE_SECRET_KEY = originalSecret;
  }
});

test("repete uma vez quando o Supabase responde com falha transitória", async () => {
  const originalFetch = global.fetch;
  const originalUrl = process.env.SUPABASE_URL;
  const originalSecret = process.env.SUPABASE_SECRET_KEY;
  let requests = 0;

  process.env.SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SECRET_KEY = "sb_secret_teste_retry";
  global.fetch = async () => {
    requests += 1;
    if(requests === 1) return new Response(JSON.stringify({message:"temporariamente indisponível"}), {status:503});
    return new Response("[]", {status:200});
  };

  try{
    await getState();
    assert.equal(requests, 2);
  }finally{
    global.fetch = originalFetch;
    if(originalUrl === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = originalUrl;
    if(originalSecret === undefined) delete process.env.SUPABASE_SECRET_KEY;
    else process.env.SUPABASE_SECRET_KEY = originalSecret;
  }
});

test("recusa chave pública na função privilegiada de sincronização", async () => {
  const originalFetch = global.fetch;
  const originalUrl = process.env.SUPABASE_URL;
  const originalSecret = process.env.SUPABASE_SECRET_KEY;

  process.env.SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SECRET_KEY = "sb_publishable_teste_nao_real";
  global.fetch = async () => { throw new Error("fetch não deveria ser chamado"); };

  try{
    await assert.rejects(getState(), error => error.code === "SUPABASE_PUBLIC_KEY_NOT_ALLOWED");
  }finally{
    global.fetch = originalFetch;
    if(originalUrl === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = originalUrl;
    if(originalSecret === undefined) delete process.env.SUPABASE_SECRET_KEY;
    else process.env.SUPABASE_SECRET_KEY = originalSecret;
  }
});
