import {json, readJson} from "../lib/http.js";
import {getState, putState} from "../lib/supabase.js";

function databaseErrorCode(error){
  if(String(error?.message || "").includes("Supabase não configurado")){
    return "SUPABASE_NOT_CONFIGURED";
  }
  if(error?.status === 401 || error?.status === 403) return "SUPABASE_AUTH_FAILED";
  if(error?.status === 404) return "SUPABASE_RESOURCE_NOT_FOUND";
  if(error?.status === 400) return "SUPABASE_REQUEST_REJECTED";
  return "SUPABASE_UNAVAILABLE";
}

export default async function handler(req, res){
  try{
    if(req.method === "GET"){
      const row = await getState();
      return json(res, 200, row ? {exists:true, state:row.state, updatedAt:row.updated_at} : {exists:false});
    }
    if(req.method === "PUT"){
      const body = await readJson(req);
      if(!body.state || typeof body.state !== "object" || Array.isArray(body.state)) return json(res, 400, {error:"Estado inválido."});
      await putState(body.state);
      return json(res, 200, {ok:true});
    }
    return json(res, 405, {error:"Método não permitido."});
  }catch(error){
    console.error(error);
    return json(res, 500, {
      error:"Não foi possível acessar a base de dados.",
      code:databaseErrorCode(error)
    });
  }
}
