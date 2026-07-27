import {ImapFlow} from "imapflow";
import {decryptEmailPassword, encryptEmailPassword} from "./email-credentials.js";
import {
  getEmailIntegration,
  insertEmailNotification,
  putEmailIntegration,
  updateEmailIntegration
} from "./supabase.js";

export const ZIMBRA_CONFIG = Object.freeze({
  host:"webmail.sesau.ro.gov.br",
  port:993,
  secure:true,
  username:"nr.cemetron@sesau.ro.gov.br",
  mailbox:"INBOX"
});

const MINIMUM_SYNC_INTERVAL_MS = 8_000;

function createClient(password){
  return new ImapFlow({
    host:ZIMBRA_CONFIG.host,
    port:ZIMBRA_CONFIG.port,
    secure:ZIMBRA_CONFIG.secure,
    auth:{user:ZIMBRA_CONFIG.username, pass:password},
    tls:{rejectUnauthorized:true},
    authTimeout:15_000,
    socketTimeout:25_000,
    disableAutoIdle:true,
    logger:false
  });
}

function mailboxIdentity(mailbox){
  return mailbox?.uidValidity === undefined || mailbox?.uidValidity === null
    ? null
    : String(mailbox.uidValidity);
}

function latestUid(mailbox){
  return Math.max(0, Number(mailbox?.uidNext || 1) - 1);
}

function formatMailbox(mailbox){
  if(!mailbox) return "";
  const address = mailbox.address || "";
  const name = String(mailbox.name || "").replace(/[\r\n\t]+/g, " ").trim();
  return name && address ? `${name} <${address}>` : address || name;
}

function cleanText(value, fallback, maximumLength){
  return String(value || fallback)
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maximumLength);
}

export function messageToNotification(message){
  const sender = (message.envelope?.from || [])
    .map(formatMailbox)
    .filter(Boolean)
    .slice(0,3)
    .join(", ");
  const receivedAt = new Date(message.internalDate || Date.now()).toISOString();
  return {
    event_key:cleanText(
      message.envelope?.messageId || `zimbra:${message.uid}:${receivedAt}`,
      `zimbra:${message.uid}:${receivedAt}`,
      200
    ),
    sender:cleanText(sender, "Remetente não identificado", 300),
    subject:cleanText(message.envelope?.subject, "Sem assunto", 500),
    received_at:receivedAt
  };
}

async function openMailbox(password){
  const client = createClient(password);
  client.on("error", () => {});
  try{
    await client.connect();
    const mailbox = await client.mailboxOpen(ZIMBRA_CONFIG.mailbox, {readOnly:true});
    return {client, mailbox};
  }catch(error){
    if(client.usable) await client.logout().catch(() => {});
    throw error;
  }
}

function publicIntegration(row, overrides={}){
  return {
    configured:Boolean(row?.password_ciphertext),
    host:ZIMBRA_CONFIG.host,
    port:ZIMBRA_CONFIG.port,
    secure:ZIMBRA_CONFIG.secure,
    username:ZIMBRA_CONFIG.username,
    mailbox:ZIMBRA_CONFIG.mailbox,
    lastCheckedAt:row?.last_checked_at || null,
    lastError:row?.last_error || null,
    ...overrides
  };
}

export async function getPublicEmailIntegration(){
  const row = await getEmailIntegration();
  return publicIntegration(row);
}

export async function configureZimbra(password, {openMailboxImpl=openMailbox}={}){
  let connection;
  try{
    connection = await openMailboxImpl(password);
    const {client, mailbox} = connection;
    const rows = await putEmailIntegration({
      ...ZIMBRA_CONFIG,
      password_ciphertext:encryptEmailPassword(password),
      uid_validity:mailboxIdentity(mailbox),
      last_uid:latestUid(mailbox),
      active_shift_id:null,
      last_checked_at:new Date().toISOString(),
      last_error:null
    });
    return publicIntegration(rows?.[0], {configured:true, connectionTested:true});
  }finally{
    if(connection?.client?.usable) await connection.client.logout().catch(() => {});
  }
}

export async function syncZimbraNotifications({
  force=false,
  shiftId=null,
  shiftStartedAt=null,
  openMailboxImpl=openMailbox
}={}){
  const row = await getEmailIntegration();
  if(!row?.password_ciphertext) return publicIntegration(row);
  if(!shiftId) return publicIntegration(row, {monitoringActive:false});

  const newShift = row.active_shift_id !== shiftId;
  const lastChecked = row.last_checked_at ? new Date(row.last_checked_at).getTime() : 0;
  if(!force && !newShift && Date.now() - lastChecked < MINIMUM_SYNC_INTERVAL_MS){
    return publicIntegration(row, {skipped:true});
  }

  const startedAt = new Date().toISOString();
  await updateEmailIntegration({last_checked_at:startedAt});
  let client;
  try{
    const password = decryptEmailPassword(row.password_ciphertext);
    const connection = await openMailboxImpl(password);
    client = connection.client;
    const mailbox = connection.mailbox;
    const currentUidValidity = mailboxIdentity(mailbox);
    let lastUid = Math.max(0, Number(row.last_uid || 0));
    const shiftStartedAtMs = shiftStartedAt ? new Date(shiftStartedAt).getTime() : Number.NaN;

    if(row.uid_validity && currentUidValidity && row.uid_validity !== currentUidValidity){
      lastUid = latestUid(mailbox);
    }else if(newShift && !Number.isFinite(shiftStartedAtMs)){
      lastUid = latestUid(mailbox);
    }else if(lastUid < latestUid(mailbox)){
      const messages = [];
      for await (const message of client.fetch(
        `${lastUid + 1}:*`,
        {uid:true, envelope:true, internalDate:true},
        {uid:true}
      )){
        if(message.uid > lastUid) messages.push(message);
      }
      messages.sort((left, right) => left.uid - right.uid);
      for(const message of messages){
        const receivedAtMs = new Date(message.internalDate || 0).getTime();
        if(!newShift || (Number.isFinite(receivedAtMs) && receivedAtMs >= shiftStartedAtMs)){
          await insertEmailNotification(messageToNotification(message));
        }
        lastUid = Math.max(lastUid, Number(message.uid));
      }
    }

    const checkedAt = new Date().toISOString();
    await updateEmailIntegration({
      uid_validity:currentUidValidity,
      last_uid:lastUid,
      active_shift_id:shiftId,
      last_checked_at:checkedAt,
      last_error:null
    });
    return publicIntegration(row, {
      configured:true,
      monitoringActive:true,
      lastCheckedAt:checkedAt,
      lastError:null
    });
  }catch(error){
    const message = String(error?.message || "Falha ao consultar o Zimbra.").slice(0,300);
    await updateEmailIntegration({
      last_checked_at:new Date().toISOString(),
      last_error:message
    }).catch(() => {});
    return publicIntegration(row, {
      configured:true,
      lastCheckedAt:new Date().toISOString(),
      lastError:message
    });
  }finally{
    if(client?.usable) await client.logout().catch(() => {});
  }
}
