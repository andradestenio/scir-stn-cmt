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
