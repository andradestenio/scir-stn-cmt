import {isAuthenticated} from "../lib/auth.js";
import {json, readJson} from "../lib/http.js";
import {
  configureZimbra,
  getPublicEmailIntegration
} from "../lib/zimbra.js";

export default async function handler(req, res){
  try{
    if(!isAuthenticated(req)) return json(res, 401, {error:"Sessão expirada."});
    if(req.method === "GET"){
      return json(res, 200, {integration:await getPublicEmailIntegration()});
    }
    if(req.method === "PUT"){
      const body = await readJson(req);
      const password = String(body.password || "");
      if(!password || password.length > 256){
        return json(res, 400, {error:"Informe uma senha válida para o Zimbra."});
      }
      const integration = await configureZimbra(password);
      return json(res, 200, {ok:true, integration});
    }
    return json(res, 405, {error:"Método não permitido."});
  }catch(error){
    console.error("Falha na configuração do Zimbra:", error?.message || error);
    return json(res, 400, {
      error:"Não foi possível entrar no Zimbra. Confira a senha e tente novamente."
    });
  }
}
