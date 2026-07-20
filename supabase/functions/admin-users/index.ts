import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authClient = createClient(url, anon, {
      global: { headers: { Authorization: req.headers.get("Authorization") || "" } }
    });
    const admin = createClient(url, service, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { data: { user }, error: userError } = await authClient.auth.getUser();
    if (userError || !user) throw new Error("Não autenticado.");

    const { data: profile } = await admin.from("profiles")
      .select("perfil,ativo").eq("id", user.id).single();

    if (!profile?.ativo || profile.perfil !== "ADMIN") {
      throw new Error("Acesso restrito ao administrador.");
    }

    const body = await req.json();

    if (body.action === "list") {
      const { data, error } = await admin.from("profiles")
        .select("id,nome,username,email,perfil,ativo,created_at").order("nome");
      if (error) throw error;
      return json({ users: data });
    }

    if (body.action === "create") {
      const username = String(body.username || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\\u0300-\\u036f]/g, "")
        .replace(/[^a-z0-9._-]/g, "");

      if (!username || !body.password || String(body.password).length < 8) {
        throw new Error("Login válido e senha de pelo menos 8 caracteres são obrigatórios.");
      }

      const internalEmail = `${username}@nircemetron.local`;

      const { data, error } = await admin.auth.admin.createUser({
        email: internalEmail,
        password: String(body.password),
        email_confirm: true,
        user_metadata: {
          nome: String(body.nome || ""),
          username,
          perfil: body.perfil === "ADMIN" ? "ADMIN" : "USUARIO"
        }
      });
      if (error) throw error;

      await admin.from("profiles").update({
        nome: String(body.nome || ""),
        username,
        perfil: body.perfil === "ADMIN" ? "ADMIN" : "USUARIO",
        ativo: true
      }).eq("id", data.user.id);

      await admin.from("audit_logs").insert({
        actor_id: user.id, action: "CRIACAO_USUARIO",
        target_id: data.user.id, details: { username, perfil: body.perfil }
      });

      return json({ ok: true });
    }

    if (body.action === "toggle") {
      if (body.id === user.id && body.ativo === false) {
        throw new Error("O administrador não pode inativar o próprio acesso.");
      }
      const { error } = await admin.from("profiles")
        .update({ ativo: Boolean(body.ativo), updated_at: new Date().toISOString() })
        .eq("id", body.id);
      if (error) throw error;

      await admin.from("audit_logs").insert({
        actor_id: user.id, action: body.ativo ? "ATIVACAO_USUARIO" : "INATIVACAO_USUARIO",
        target_id: body.id
      });

      return json({ ok: true });
    }

    throw new Error("Ação inválida.");
  } catch (error) {
    return json({ error: error.message }, 400);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}
