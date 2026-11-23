import crypto from "node:crypto";
import {simpleParser} from "mailparser";
import sanitizeHtml from "sanitize-html";
import {openMailbox, messageToNotification} from "./zimbra.js";
import {getEmailIntegration, getEmailNotification} from "./supabase.js";
import {decryptEmailPassword} from "./email-credentials.js";

export const MAX_MESSAGE_BYTES = 25 * 1024 * 1024;
export const CHUNK_BYTES = 3 * 1024 * 1024;
export function contentError(status, message){
  return Object.assign(new Error(message), {status, publicMessage:message});
}
export function safeEmailHtml(html){
  return sanitizeHtml(html || "", {
    allowedTags:["p","br","div","span","strong","b","em","i","u","s","blockquote","pre","code","ul","ol","li","table","thead","tbody","tfoot","tr","th","td","h1","h2","h3","h4","hr"],
    allowedAttributes:{td:["colspan","rowspan"],th:["colspan","rowspan"]},
    disallowedTagsMode:"discard"
  });
}
export function safeFilename(value, index=0){
  return String(value || `anexo-${index + 1}`).replace(/[\x00-\x1f\x7f/\\]/g,"_").slice(0,180) || `anexo-${index + 1}`;
}
export function attachmentMetadata(attachment, index){
  return {id:index, filename:safeFilename(attachment.filename,index),
    contentType:attachment.contentType || "application/octet-stream", size:attachment.content.length,
    sha256:crypto.createHash("sha256").update(attachment.content).digest("hex")};
}

// Every read opens INBOX read-only. No flags, moves, deletions or body persistence.
export async function readEmailContent(eventKey, {
  getNotification=getEmailNotification, getIntegration=getEmailIntegration,
  connect=openMailbox, decrypt=decryptEmailPassword
}={}){
  const notification = await getNotification(eventKey);
  if(!notification) throw contentError(404,"Aviso de e-mail não encontrado.");
  const integration = await getIntegration();
  if(!integration?.password_ciphertext) throw contentError(409,"Configure o e-mail do NIR antes de abrir a mensagem.");
  let client;
  try{
    const connection = await connect(decrypt(integration.password_ciphertext));
    client = connection.client;
    let uid;
    if(notification.imap_uid && String(notification.imap_uid_validity) === String(connection.mailbox.uidValidity)){
      uid = notification.imap_uid;
    }else if(!eventKey.startsWith("zimbra:")){
      const matches = await client.search({header:{"Message-ID":eventKey}}, {uid:true});
      if(matches?.length === 1) uid = matches[0];
    }else{
      // Legacy notifications without Message-ID are only resolved when the
      // integration still has the same UID namespace; date is verified below.
      const match = /^zimbra:(\d+):/.exec(eventKey);
      if(match && String(integration.uid_validity) === String(connection.mailbox.uidValidity)) uid = Number(match[1]);
    }
    if(!uid) throw contentError(404,"A mensagem não foi localizada com segurança na Caixa de entrada. Ela pode ter sido movida ou excluída; consulte o webmail.");
    const meta = await client.fetchOne(uid,{uid:true,envelope:true,internalDate:true,size:true},{uid:true});
    if(!meta || messageToNotification(meta).event_key !== eventKey ||
      new Date(meta.internalDate).getTime() !== new Date(notification.received_at).getTime()){
      throw contentError(404,"A mensagem original não está mais disponível na Caixa de entrada.");
    }
    if(!Number.isFinite(meta.size) || meta.size > MAX_MESSAGE_BYTES){
      throw contentError(413,"Esta mensagem excede o limite de 25 MB do leitor. Abra-a pelo webmail.");
    }
    const message = await client.fetchOne(uid,{source:{start:0,maxLength:MAX_MESSAGE_BYTES + 1}},{uid:true});
    if(!message?.source) throw contentError(404,"Conteúdo da mensagem indisponível.");
    if(message.source.length > MAX_MESSAGE_BYTES) throw contentError(413,"Mensagem acima de 25 MB. Utilize o webmail.");
    const parsed = await simpleParser(message.source,{skipImageLinks:true,skipTextToHtml:true});
    const html = safeEmailHtml(parsed.html);
    const text = parsed.text || "";
    if(Buffer.byteLength(text) + Buffer.byteLength(html) > 2 * 1024 * 1024){
      throw contentError(413,"O texto desta mensagem é muito extenso para o leitor. Consulte o conteúdo completo no webmail.");
    }
    return {
      detail:{subject:parsed.subject || notification.subject, from:parsed.from?.text || notification.sender,
        to:parsed.to?.text || "", cc:parsed.cc?.text || "", receivedAt:notification.received_at,
        text, html, attachments:(parsed.attachments || []).map(attachmentMetadata)},
      attachments:parsed.attachments || []
    };
  }finally{
    if(client?.usable) await client.logout().catch(() => {});
  }
}
