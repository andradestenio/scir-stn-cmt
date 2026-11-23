import {json} from "../lib/http.js";
import {requireAuth} from "../lib/auth.js";
import {readEmailContent, CHUNK_BYTES, contentError} from "../lib/email-content.js";

export function createEmailMessageHandler({authorize=requireAuth,read=readEmailContent}={}){
  return async function handler(req,res){
    try{
      if(!authorize(req,res)) return;
      if(req.method !== "GET") return json(res,405,{error:"Método não permitido."});
      const params = new URL(req.url || "/","https://scir.local").searchParams;
      const key = params.get("eventKey") || "";
      if(!key || key.length > 200 || /[\r\n\x00]/.test(key)) throw contentError(400,"Identificador de e-mail inválido.");
      const part = params.get("attachment");
      const offset = params.get("offset") || "0";
      if(part !== null && (!/^\d{1,4}$/.test(part) || !/^\d{1,9}$/.test(offset))) throw contentError(400,"Anexo inválido.");
      const result = await read(key);
      if(part === null) return json(res,200,result.detail);
      const attachment = result.attachments[Number(part)];
      const meta = result.detail.attachments[Number(part)];
      if(!attachment || !meta) throw contentError(404,"Anexo não encontrado.");
      if(params.get("sha256") !== meta.sha256) throw contentError(409,"O anexo mudou. Feche e reabra o e-mail.");
      const start = Number(offset);
      if(start >= attachment.content.length && !(start === 0 && attachment.content.length === 0)) throw contentError(416,"Trecho do anexo inválido.");
      res.statusCode = 200;
      res.setHeader("Cache-Control","no-store, private");
      res.setHeader("Content-Type","application/octet-stream");
      res.setHeader("X-Content-Type-Options","nosniff");
      res.setHeader("Content-Disposition","attachment");
      return res.end(attachment.content.subarray(start,start + CHUNK_BYTES));
    }catch(error){
      return json(res,error.publicMessage ? error.status : 502,{error:error.publicMessage || "Não foi possível consultar o conteúdo no Zimbra. Confira a conexão e tente novamente."});
    }
  };
}
export default createEmailMessageHandler();
