import {json, readJson} from "../lib/http.js";
import {getState, putState} from "../lib/supabase.js";
import {requireAuth} from "../lib/auth.js";

function databaseErrorCode(error){
  if(error?.code) return error.code;
  if(String(error?.message || "").includes("Supabase não configurado")) return "SUPABASE_NOT_CONFIGURED";
  if(error?.status === 401 || error?.status === 403) return "SUPABASE_AUTH_FAILED";
  if(error?.status === 404 || error?.databaseCode === "42P01" || error?.databaseCode === "PGRST205") return "SUPABASE_RESOURCE_NOT_FOUND";
  if(error?.databaseCode === "42703") return "SUPABASE_SCHEMA_INVALID";
  if(error?.status === 400) return "SUPABASE_REQUEST_REJECTED";
  if(error?.status === 408 || error?.status === 504) return "SUPABASE_TIMEOUT";
  if(error?.status === 429) return "SUPABASE_RATE_LIMITED";
  if(error?.status >= 500) return "SUPABASE_SERVICE_UNAVAILABLE";
  return "SUPABASE_UNAVAILABLE";
}

function databaseErrorMessage(code){
  const messages = {
    SUPABASE_NOT_CONFIGURED:"As variáveis SUPABASE_URL e SUPABASE_SECRET_KEY não estão configuradas na Vercel.",
    SUPABASE_CONFIGURATION_INVALID:"A URL configurada para o Supabase é inválida.",
    SUPABASE_PUBLIC_KEY_NOT_ALLOWED:"Foi configurada uma chave pública. Use a Secret key iniciada por sb_secret_.",
    SUPABASE_AUTH_FAILED:"O Supabase rejeitou a chave configurada.",
    SUPABASE_RESOURCE_NOT_FOUND:"A tabela public.app_state não foi encontrada no Supabase.",
    SUPABASE_SCHEMA_INVALID:"A tabela app_state está desatualizada. Execute novamente o arquivo supabase/schema.sql.",
    SUPABASE_REQUEST_REJECTED:"O Supabase rejeitou a consulta. Verifique a tabela app_state.",
    SUPABASE_TIMEOUT:"O Supabase não respondeu dentro do tempo esperado.",
    SUPABASE_RATE_LIMITED:"O Supabase limitou temporariamente as solicitações.",
    SUPABASE_NETWORK_ERROR:"A função da Vercel não conseguiu alcançar o Supabase.",
    SUPABASE_INVALID_RESPONSE:"O Supabase devolveu uma resposta inválida.",
    SUPABASE_SERVICE_UNAVAILABLE:"O serviço do Supabase está temporariamente indisponível.",
    SUPABASE_UNAVAILABLE:"Não foi possível concluir a comunicação com o Supabase."
  };
  return messages[code] || messages.SUPABASE_UNAVAILABLE;
}

function databaseHttpStatus(code){
  if(code === "SUPABASE_REQUEST_REJECTED" || code === "SUPABASE_CONFIGURATION_INVALID" || code === "SUPABASE_PUBLIC_KEY_NOT_ALLOWED") return 400;
  if(code === "SUPABASE_AUTH_FAILED") return 502;
  if(code === "SUPABASE_RESOURCE_NOT_FOUND" || code === "SUPABASE_SCHEMA_INVALID") return 503;
  if(code === "SUPABASE_RATE_LIMITED") return 429;
  return 503;
}

export default async function handler(req, res){
  try{
    if(!requireAuth(req,res)) return;
    if(req.method === "GET"){
      const row = await getState();
      return json(res, 200, row ? {exists:true, state:row.state, updatedAt:row.updated_at} : {exists:false});
    }
    if(req.method === "PUT"){
      const body = await readJson(req);
      if(!body.state || typeof body.state !== "object" || Array.isArray(body.state)) return json(res, 400, {error:"Estado inválido."});
      const row = await putState(body.state);
      return json(res, 200, {ok:true, updatedAt:row?.updated_at || new Date().toISOString()});
    }
    return json(res, 405, {error:"Método não permitido."});
  }catch(error){
    console.error(error);
    const code = databaseErrorCode(error);
    return json(res, databaseHttpStatus(code), {
      error:databaseErrorMessage(code),
      code
    });
  }
}
