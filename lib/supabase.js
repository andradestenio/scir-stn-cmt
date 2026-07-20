const ROW_ID = "nir-cemetron-principal";

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
