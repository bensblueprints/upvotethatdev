import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Body =
  | {
      mode: "adjust";
      target_user_id?: string;
      target_email?: string;
      delta: number;
      reason?: string;
    }
  | {
      mode: "set";
      target_user_id?: string;
      target_email?: string;
      balance: number;
      reason?: string;
    };

function json(status: number, payload: any) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { ok: false, code: "METHOD_NOT_ALLOWED" });

  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) {
    return json(500, { ok: false, code: "SERVER_MISCONFIGURED", message: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" });
  }

  const authHeader = req.headers.get("authorization") || "";
  const jwt = authHeader.toLowerCase().startsWith("bearer ") ? authHeader.slice(7) : "";
  if (!jwt) return json(401, { ok: false, code: "UNAUTHORIZED", message: "Missing bearer token" });

  const supabaseAdmin = createClient(url, serviceKey);

  // Identify caller
  const { data: userRes, error: userErr } = await supabaseAdmin.auth.getUser(jwt);
  if (userErr || !userRes?.user) {
    return json(401, { ok: false, code: "UNAUTHORIZED", message: userErr?.message || "Invalid token" });
  }

  const callerId = userRes.user.id;
  const { data: callerProfile, error: callerProfErr } = await supabaseAdmin
    .from("profiles")
    .select("id, is_admin, email")
    .eq("id", callerId)
    .maybeSingle();

  if (callerProfErr) return json(500, { ok: false, code: "FAILED", message: callerProfErr.message });
  if (!callerProfile?.is_admin) return json(403, { ok: false, code: "FORBIDDEN", message: "Admin only" });

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return json(400, { ok: false, code: "BAD_JSON", message: "Invalid JSON body" });
  }

  const target_user_id = (body as any).target_user_id as string | undefined;
  const target_email = ((body as any).target_email as string | undefined)?.trim().toLowerCase();
  if (!target_user_id && !target_email) {
    return json(400, { ok: false, code: "MISSING_TARGET", message: "Provide target_user_id or target_email" });
  }

  // Load target
  let targetId = target_user_id || "";
  if (!targetId) {
    const { data: prof, error } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .ilike("email", target_email!)
      .maybeSingle();
    if (error) return json(500, { ok: false, code: "FAILED", message: error.message });
    if (!prof?.id) return json(404, { ok: false, code: "NOT_FOUND", message: "User not found" });
    targetId = prof.id;
  }

  const { data: targetProfile, error: targetErr } = await supabaseAdmin
    .from("profiles")
    .select("id, email, balance")
    .eq("id", targetId)
    .single();
  if (targetErr) return json(500, { ok: false, code: "FAILED", message: targetErr.message });

  const currentBalance = Number(targetProfile.balance || 0);
  let newBalance: number;
  let deltaApplied: number;

  if (body.mode === "adjust") {
    const delta = Number((body as any).delta);
    if (!Number.isFinite(delta)) return json(400, { ok: false, code: "INVALID_DELTA", message: "delta must be a number" });
    newBalance = currentBalance + delta;
    deltaApplied = delta;
  } else {
    const bal = Number((body as any).balance);
    if (!Number.isFinite(bal)) return json(400, { ok: false, code: "INVALID_BALANCE", message: "balance must be a number" });
    newBalance = bal;
    deltaApplied = newBalance - currentBalance;
  }

  if (newBalance < 0) return json(400, { ok: false, code: "NEGATIVE_BALANCE", message: "Balance cannot be negative" });

  const { error: updateErr } = await supabaseAdmin.from("profiles").update({ balance: newBalance }).eq("id", targetId);
  if (updateErr) return json(500, { ok: false, code: "FAILED", message: updateErr.message });

  // Best-effort transaction record (so the user/admin can see balance changes in history)
  if (Number.isFinite(deltaApplied) && deltaApplied !== 0) {
    const reason = ((body as any).reason as string | undefined)?.trim();
    await supabaseAdmin.from("transactions").insert({
      user_id: targetId,
      type: "admin_adjustment",
      amount: deltaApplied,
      status: "completed",
      description: reason ? `Admin adjustment: ${reason}` : "Admin adjustment",
    } as any);
  }

  // Best-effort audit log
  await supabaseAdmin.from("audit_logs").insert({
    action: "adjust_balance",
    resource_type: "profiles",
    resource_id: targetId,
    user_id: callerId,
    details: {
      mode: body.mode,
      reason: (body as any).reason || null,
      target_email: targetProfile.email,
      previous_balance: currentBalance,
      new_balance: newBalance,
      delta: deltaApplied,
    },
  } as any);

  return json(200, {
    ok: true,
    target: { id: targetProfile.id, email: targetProfile.email },
    previous_balance: currentBalance,
    balance: newBalance,
  });
});

