import {json} from "../../lib/http.js";
import {expiredSessionCookie} from "../../lib/auth.js";

export default async function handler(req,res){
  if(req.method !== "POST") return json(res,405,{error:"Método não permitido."});
  res.setHeader("Set-Cookie",expiredSessionCookie(req));
  return json(res,200,{ok:true});
}
