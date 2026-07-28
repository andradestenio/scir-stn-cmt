import {isAuthenticated} from "../lib/auth.js";
import {json} from "../lib/http.js";
import {listEmailNotifications} from "../lib/supabase.js";
import {
  getPublicEmailIntegration,
  syncZimbraNotifications
} from "../lib/zimbra.js";

function requestedShiftId(req){
  const raw = req.query?.shiftId ||
    new URL(req.url || "/", "https://scir.local").searchParams.get("shiftId") ||
    "";
  const shiftId = String(raw).trim();
  return shiftId && shiftId.length <= 200 ? shiftId : null;
}

function requestedHistoryShiftId(req){
  const raw = req.query?.historyShiftId ||
    new URL(req.url || "/", "https://scir.local").searchParams.get("historyShiftId") ||
    "";
  const shiftId = String(raw).trim();
  return shiftId && shiftId.length <= 200 ? shiftId : null;
}

function requestedShiftStartedAt(req){
  const raw = req.query?.shiftStartedAt ||
    new URL(req.url || "/", "https://scir.local").searchParams.get("shiftStartedAt") ||
    "";
  const parsed = new Date(String(raw));
  return raw && !Number.isNaN(parsed.getTime()) ? parsed.toISOString() : null;
}

export default async function handler(req, res){
  try{
    if(!isAuthenticated(req)) return json(res, 401, {error:"Sessão expirada."});
    if(req.method !== "GET") return json(res, 405, {error:"Método não permitido."});

    const shiftId = requestedShiftId(req);
    const historyShiftId = requestedHistoryShiftId(req) || shiftId;
    const shiftStartedAt = requestedShiftStartedAt(req);
    const integration = shiftId
      ? await syncZimbraNotifications({shiftId, shiftStartedAt})
      : await getPublicEmailIntegration();
    const rows = await listEmailNotifications(500);
    const notifications = (rows || [])
      .filter(row => historyShiftId && row.shift_id === historyShiftId)
      .map(row => ({
        eventKey:row.event_key,
        sender:row.sender,
        subject:row.subject,
        receivedAt:row.received_at,
        createdAt:row.created_at,
        readAt:row.read_at || null,
        respondedAt:row.responded_at || null
      }));
    return json(res, 200, {
      notifications,
      integration,
      monitoringActive:Boolean(shiftId),
      historyShiftId
    });
  }catch(error){
    console.error(error);
    return json(res, 500, {error:"Não foi possível carregar as notificações de e-mail."});
  }
}
