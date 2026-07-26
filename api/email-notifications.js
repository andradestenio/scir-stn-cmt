import {isAuthenticated} from "../lib/auth.js";
import {json} from "../lib/http.js";
import {listEmailNotifications} from "../lib/supabase.js";
import {syncZimbraNotifications} from "../lib/zimbra.js";

export default async function handler(req, res){
  try{
    if(!isAuthenticated(req)) return json(res, 401, {error:"Sessão expirada."});
    if(req.method !== "GET") return json(res, 405, {error:"Método não permitido."});

    const integration = await syncZimbraNotifications();
    const rows = await listEmailNotifications(30);
    const notifications = (rows || []).map(row => ({
      eventKey:row.event_key,
      sender:row.sender,
      subject:row.subject,
      receivedAt:row.received_at,
      createdAt:row.created_at
    }));
    return json(res, 200, {notifications, integration});
  }catch(error){
    console.error(error);
    return json(res, 500, {error:"Não foi possível carregar as notificações de e-mail."});
  }
}
