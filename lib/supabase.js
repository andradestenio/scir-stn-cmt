import crypto from "node:crypto";

const ROW_ID = "nir-cemetron-principal";
const EMAIL_INTEGRATION_ID = "nir-cemetron-email-integration";
const EMAIL_NOTIFICATION_PREFIX = "nir-cemetron-email-notification:";

function emailNotificationId(eventKey){
  const digest = crypto
    .createHash("sha256")
    .update(String(eventKey))
    .digest("hex");
  return `${EMAIL_NOTIFICATION_PREFIX}${digest}`;
}

function cleanEnvironmentValue(value){
  const normalized = String(value || "").trim();
  if(
    normalized.length >= 2 &&
    ((normalized.startsWith('"') && normalized.endsWith('"')) ||
      (normalized.startsWith("'") && normalized.endsWith("'")))
  ){
    return normalized.slice(1, -1).trim();
  }
  return normalized;
}

function normalizeSupabaseUrl(value){
  const normalized = cleanEnvironmentValue(value)
    .replace(/\/+$/, "")
    .replace(/\/rest\/v1$/i, "");
  if(!normalized) return "";
  let parsed;
  try{
    parsed = new URL(normalized);
  }catch{
    const error = new Error("URL do Supabase inválida.");
    error.code = "SUPABASE_CONFIGURATION_INVALID";
    throw error;
  }
  if(parsed.protocol !== "https:" || !parsed.hostname){
    const error = new Error("URL do Supabase inválida.");
    error.code = "SUPABASE_CONFIGURATION_INVALID";
    throw error;
  }
  return parsed.toString().replace(/\/$/, "");
}

function config(){
  const url = normalizeSupabaseUrl(
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    ""
  );
  const key = cleanEnvironmentValue(process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_KEY);
  if(!url || !key){
    const error = new Error("Supabase não configurado.");
    error.code = "SUPABASE_NOT_CONFIGURED";
    throw error;
  }
  if(!key.startsWith("sb_secret_") && key.startsWith("sb_publishable_")){
    const error = new Error("A chave informada não é uma Secret key.");
    error.code = "SUPABASE_PUBLIC_KEY_NOT_ALLOWED";
    throw error;
  }
  return {url, key};
}

function requestHeaders(key, extraHeaders={}){
  const headers = {
    apikey:key,
    "Content-Type":"application/json",
    ...extraHeaders
  };
  // As novas chaves opacas sb_secret_/sb_publishable_ não são JWTs e devem
  // ser enviadas somente em `apikey`. Chaves legadas JWT continuam usando
  // também Authorization para manter compatibilidade com instalações antigas.
  if(!String(key).startsWith("sb_")){
    headers.Authorization = `Bearer ${key}`;
  }
  return headers;
}

function retryableStatus(status){
  return status === 408 || status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}

async function request(path, options={}, attempt=0){
  const {url, key} = config();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  let response;
  try{
    response = await fetch(`${url}/rest/v1/${path}`, {
      ...options,
      headers:requestHeaders(key, options.headers || {}),
      signal:controller.signal
    });
  }catch(cause){
    clearTimeout(timeout);
    if(attempt < 1) return request(path, options, attempt + 1);
    const error = new Error(cause?.name === "AbortError"
      ? "Tempo limite ao acessar o Supabase."
      : "Falha de comunicação com o Supabase.");
    error.code = cause?.name === "AbortError" ? "SUPABASE_TIMEOUT" : "SUPABASE_NETWORK_ERROR";
    error.status = 503;
    throw error;
  }
  clearTimeout(timeout);
  const text = await response.text();
  let payload = null;
  if(text){
    try{
      payload = JSON.parse(text);
    }catch{
      if(!response.ok){
        payload = {message:text.slice(0, 300)};
      }else{
        const error = new Error("Resposta inválida recebida do Supabase.");
        error.code = "SUPABASE_INVALID_RESPONSE";
        error.status = 502;
        throw error;
      }
    }
  }
  if(!response.ok){
    if(attempt < 1 && retryableStatus(response.status)){
      return request(path, options, attempt + 1);
    }
    const error = new Error(payload?.message || payload?.hint || `Erro da base de dados (${response.status}).`);
    error.status = response.status;
    error.databaseCode = payload?.code || null;
    throw error;
  }
  return payload;
}

export async function getState(){
  const rows = await request(`app_state?id=eq.${encodeURIComponent(ROW_ID)}&select=state,updated_at`);
  return rows?.[0] || null;
}

export async function putState(state){
  const rows = await request("app_state?on_conflict=id", {
    method:"POST",
    headers:{Prefer:"resolution=merge-duplicates,return=representation"},
    body:JSON.stringify({id:ROW_ID, state, updated_at:new Date().toISOString()})
  });
  return rows?.[0] || null;
}

export async function listEmailNotifications(limit=30){
  const safeLimit = Math.max(1, Math.min(Number(limit) || 30, 500));
  const pattern = encodeURIComponent(`${EMAIL_NOTIFICATION_PREFIX}*`);
  const rows = await request(`app_state?id=like.${pattern}&select=state,updated_at&order=updated_at.desc&limit=${safeLimit}`);
  return (rows || []).map(row => ({
    ...(row.state || {}),
    created_at:row.state?.created_at || row.updated_at
  }));
}

export async function insertEmailNotification(notification){
  const createdAt = new Date().toISOString();
  return request("app_state?on_conflict=id", {
    method:"POST",
    headers:{Prefer:"resolution=ignore-duplicates,return=representation"},
    body:JSON.stringify({
      id:emailNotificationId(notification.event_key),
      state:{...notification, created_at:createdAt},
      updated_at:createdAt
    })
  });
}

export async function updateEmailNotificationsStatus(eventKeys, action){
  const statusAt = new Date().toISOString();
  const updatedEventKeys = [];
  for(const eventKey of eventKeys){
    const id = emailNotificationId(eventKey);
    const rows = await request(`app_state?id=eq.${encodeURIComponent(id)}&select=state,updated_at`);
    const current = rows?.[0]?.state;
    if(!current || current.event_key !== eventKey) continue;
    const nextState = action === "pending"
      ? {
          ...current,
          read_at:null,
          responded_at:null,
          acknowledged_at:null
        }
      : action === "responded"
      ? {
          ...current,
          read_at:current.read_at || statusAt,
          responded_at:current.responded_at || statusAt,
          acknowledged_at:null
        }
      : action === "acknowledged"
        ? {
            ...current,
            read_at:current.read_at || statusAt,
            acknowledged_at:current.acknowledged_at || statusAt,
            responded_at:null
          }
        : {
            ...current,
            read_at:current.read_at || statusAt,
            responded_at:null,
            acknowledged_at:null
          };
    await request("app_state?on_conflict=id", {
      method:"POST",
      headers:{Prefer:"resolution=merge-duplicates,return=representation"},
      body:JSON.stringify({id, state:nextState, updated_at:new Date().toISOString()})
    });
    updatedEventKeys.push(eventKey);
  }
  return {eventKeys:updatedEventKeys, action, statusAt};
}

export async function getEmailIntegration(){
  const rows = await request(`app_state?id=eq.${encodeURIComponent(EMAIL_INTEGRATION_ID)}&select=state,updated_at`);
  return rows?.[0]?.state || null;
}

export async function putEmailIntegration(integration){
  const updatedAt = new Date().toISOString();
  const rows = await request("app_state?on_conflict=id", {
    method:"POST",
    headers:{Prefer:"resolution=merge-duplicates,return=representation"},
    body:JSON.stringify({
      id:EMAIL_INTEGRATION_ID,
      state:integration,
      updated_at:updatedAt
    })
  });
  return (rows || []).map(row => row.state);
}

export async function updateEmailIntegration(patch){
  const current = await getEmailIntegration();
  if(!current) return [];
  return putEmailIntegration({...current, ...patch});
}
