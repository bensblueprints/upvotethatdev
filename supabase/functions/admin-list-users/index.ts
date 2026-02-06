import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(status: number, payload: any) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

type Body = {
  q?: string;
  limit?: number;
  offset?: number;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { ok: false, code: "METHOD_NOT_ALLOWED" });

  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) {
    return json(500, {
      ok: false,
      code: "SERVER_MISCONFIGURED",
      message: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
    });
  }

  const authHeader = req.headers.get("authorization") || "";
  const jwt = authHeader.toLowerCase().startsWith("bearer ") ? authHeader.slice(7) : "";
  if (!jwt) return json(401, { ok: false, code: "UNAUTHORIZED", message: "Missing bearer token" });

  const supabaseAdmin = createClient(url, serviceKey);

  const { data: userRes, error: userErr } = await supabaseAdmin.auth.getUser(jwt);
  if (userErr || !userRes?.user) {
    return json(401, { ok: false, code: "UNAUTHORIZED", message: userErr?.message || "Invalid token" });
  }

  const callerId = userRes.user.id;
  const { data: callerProfile, error: callerProfErr } = await supabaseAdmin
    .from("profiles")
    .select("id, is_admin")
    .eq("id", callerId)
    .maybeSingle();

  if (callerProfErr) return json(500, { ok: false, code: "FAILED", message: callerProfErr.message });
  if (!callerProfile?.is_admin) return json(403, { ok: false, code: "FORBIDDEN", message: "Admin only" });

  let body: Body;
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const q = (body.q || "").trim().toLowerCase();
  const limit = Math.max(1, Math.min(500, Number(body.limit ?? 200)));
  const offset = Math.max(0, Number(body.offset ?? 0));

  let query = supabaseAdmin
    .from("profiles")
    .select("id, email, balance, is_admin, created_at", { count: "exact" })
    .order("created_at", { ascending: false });

  if (q) {
    query = query.ilike("email", `%${q}%`);
  }

  const { data, error, count } = await query.range(offset, offset + limit - 1);
  if (error) return json(500, { ok: false, code: "FAILED", message: error.message });

  return json(200, { ok: true, users: data || [], count: count ?? null, limit, offset });
});

