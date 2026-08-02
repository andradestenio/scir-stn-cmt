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

function config(){
  const url = String(process.env.SUPABASE_URL || "").replace(/\/$/, "");
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url || !key) throw new Error("Supabase não configurado.");
  return {url, key};
}

async function request(path, options={}){
  const {url, key} = config();
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...options,
    headers:{apikey:key, Authorization:`Bearer ${key}`, "Content-Type":"application/json", ...(options.headers || {})}
  });
  if(!response.ok) throw new Error(`Erro da base de dados (${response.status}).`);
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

export async function getState(){
  const rows = await request(`app_state?id=eq.${encodeURIComponent(ROW_ID)}&select=state,updated_at`);
  return rows?.[0] || null;
}

export async function putState(state){
  return request("app_state?on_conflict=id", {
    method:"POST",
    headers:{Prefer:"resolution=merge-duplicates,return=representation"},
    body:JSON.stringify({id:ROW_ID, state, updated_at:new Date().toISOString()})
  });
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
