import {clearSessionCookie} from "../lib/auth.js";
import {json} from "../lib/http.js";

export default function handler(req, res){
  if(req.method !== "POST") return json(res, 405, {error:"Método não permitido."});
  res.setHeader("Set-Cookie", clearSessionCookie());
  return json(res, 200, {ok:true});
}
