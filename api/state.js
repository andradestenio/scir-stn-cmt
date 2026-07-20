import {isAuthenticated} from "../lib/auth.js";
import {json, readJson} from "../lib/http.js";
import {getState, putState} from "../lib/supabase.js";

export default async function handler(req, res){
  try{
    if(!isAuthenticated(req)) return json(res, 401, {error:"Sessão expirada."});
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
    return json(res, 500, {error:"Não foi possível acessar a base de dados."});
  }
}
