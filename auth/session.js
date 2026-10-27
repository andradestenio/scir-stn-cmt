import {json} from "../../lib/http.js";
import {authConfiguration,sessionFromRequest} from "../../lib/auth.js";

export default async function handler(req,res){
  if(req.method !== "GET") return json(res,405,{error:"Método não permitido."});
  const config = authConfiguration();
  if(!config.ready){
    return json(res,503,{
      authenticated:false,
      error:"O acesso seguro ainda não foi configurado na Vercel.",
      code:"AUTH_NOT_CONFIGURED"
    });
  }
  const session = sessionFromRequest(req);
  if(!session){
    return json(res,401,{authenticated:false,code:"AUTH_REQUIRED"});
  }
  return json(res,200,{
    authenticated:true,
    user:{username:session.username},
    expiresAt:new Date(session.expiresAt * 1000).toISOString()
  });
}
