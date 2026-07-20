import {credentialsAreValid, createSessionCookie} from "../lib/auth.js";
import {json, readJson} from "../lib/http.js";

export default async function handler(req, res){
  if(req.method !== "POST") return json(res, 405, {error:"Método não permitido."});
  try{
    const {username="", password=""} = await readJson(req);
    if(!credentialsAreValid(username, password)) return json(res, 401, {error:"Usuário ou senha inválidos."});
    res.setHeader("Set-Cookie", createSessionCookie());
    return json(res, 200, {ok:true});
  }catch(error){
    console.error(error);
    return json(res, 500, {error:"Não foi possível iniciar a sessão."});
  }
}
