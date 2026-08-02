import {isAuthenticated} from "../lib/auth.js";
import {json, readJson} from "../lib/http.js";
import {updateEmailNotificationsStatus} from "../lib/supabase.js";

function validEventKey(value){
  const eventKey = String(value || "").trim();
  return eventKey && eventKey.length <= 200 ? eventKey : null;
}

export default async function handler(req, res){
  try{
    if(!isAuthenticated(req)) return json(res, 401, {error:"Sessão expirada."});
    if(req.method !== "PUT") return json(res, 405, {error:"Método não permitido."});
    const body = await readJson(req);
    const action = ["pending","read","responded","acknowledged"].includes(body.action)
      ? body.action
      : null;
    if(!action) return json(res, 400, {error:"Status inválido."});
    const candidates = Array.isArray(body.eventKeys) ? body.eventKeys : [body.eventKey];
    const eventKeys = [...new Set(candidates.map(validEventKey).filter(Boolean))].slice(0,30);
    if(!eventKeys.length) return json(res, 400, {error:"Notificação inválida."});

    const result = await updateEmailNotificationsStatus(eventKeys, action);
    if(!result.eventKeys.length) return json(res, 404, {error:"Notificação não encontrada."});
    return json(res, 200, {ok:true, ...result});
  }catch(error){
    console.error("Falha ao atualizar a notificação:", error?.message || error);
    return json(res, 500, {error:"Não foi possível atualizar a notificação."});
  }
}
