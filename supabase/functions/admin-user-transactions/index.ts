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
  target_user_id: string;
  limit?: number;
  offset?: number;
};

function parseSubreddit(link: string | null | undefined): string | null {
  if (!link) return null;
  const m = link.match(/\/r\/([^/]+)/i);
  return m?.[1] || null;
}

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
    return json(400, { ok: false, code: "BAD_JSON", message: "Invalid JSON body" });
  }

  const target = (body.target_user_id || "").trim();
  if (!target) return json(400, { ok: false, code: "MISSING_TARGET", message: "Provide target_user_id" });

  const limit = Math.max(1, Math.min(500, Number(body.limit ?? 100)));
  const offset = Math.max(0, Number(body.offset ?? 0));

  // Backwards-compatible select: comment_order_id may not exist yet on older deployments.
  let data: any[] | null = null;
  let count: number | null = null;
  let error: any = null;

  {
    const res = await supabaseAdmin
      .from("transactions")
      .select("id, type, amount, description, status, created_at, upvote_order_id, comment_order_id, user_id", { count: "exact" })
      .eq("user_id", target)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    data = res.data as any;
    count = (res as any).count ?? null;
    error = res.error as any;
  }

  if (error?.message && String(error.message).toLowerCase().includes("comment_order_id")) {
    const res = await supabaseAdmin
      .from("transactions")
      .select("id, type, amount, description, status, created_at, upvote_order_id, user_id", { count: "exact" })
      .eq("user_id", target)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    data = res.data as any;
    count = (res as any).count ?? null;
    error = res.error as any;
  }

  if (error) return json(500, { ok: false, code: "FAILED", message: error.message });

  const txs = (data || []) as Array<{
    id: string;
    type: string;
    amount: number;
    description: string | null;
    status: string;
    created_at: string;
    upvote_order_id: number | null;
    comment_order_id?: number | null;
    user_id: string;
  }>;

  // Bulk fetch related orders for richer history display
  const upvoteIds = Array.from(
    new Set(txs.map((t) => t.upvote_order_id).filter((v): v is number => typeof v === "number" && Number.isFinite(v))),
  );

  const upvoteOrdersById = new Map<number, any>();
  if (upvoteIds.length > 0) {
    const { data: upvotes, error: upErr } = await supabaseAdmin
      .from("upvote_orders")
      .select("id, link, quantity, service, speed, status, created_at")
      .in("id", upvoteIds);
    if (!upErr && upvotes) {
      for (const o of upvotes) upvoteOrdersById.set(o.id, o);
    }
  }

  // Comment orders: prefer explicit FK (comment_order_id). Keep a small legacy fallback for older rows.
  const commentIds = Array.from(
    new Set(
      txs
        .map((t) => t.comment_order_id)
        .filter((v): v is number => typeof v === "number" && Number.isFinite(v)),
    ),
  );

  const commentOrdersById = new Map<number, any>();
  if (commentIds.length > 0) {
    const { data: commentsById, error: cErr } = await supabaseAdmin
      .from("comment_orders")
      .select("id, created_at, link, content")
      .in("id", commentIds);
    if (!cErr && commentsById) {
      for (const o of commentsById) commentOrdersById.set(o.id, o);
    }
  }

  const wantsLegacyCommentCorrelation = txs.some((t) => {
    if (t.upvote_order_id || t.comment_order_id) return false;
    const d = (t.description || "").toLowerCase();
    return t.type === "purchase" && (d.includes("comment") || d.includes("comments"));
  });

  let legacyCommentOrders: Array<{ id: number; created_at: string; link: string; content: string }> = [];
  if (wantsLegacyCommentCorrelation) {
    const { data: comments, error: cErr } = await supabaseAdmin
      .from("comment_orders")
      .select("id, created_at, link, content")
      .eq("user_id", target)
      .order("created_at", { ascending: false })
      .limit(200);
    if (!cErr && comments) legacyCommentOrders = comments as any;
  }

  const serviceLabel = (service: any): string => {
    const n = Number(service);
    if (n === 1) return "Post Upvotes";
    if (n === 2) return "Post Downvotes";
    if (n === 3) return "Comment Upvotes";
    if (n === 4) return "Comment Downvotes";
    return "Votes";
  };

  const enriched = txs.map((t) => {
    const up = t.upvote_order_id ? upvoteOrdersById.get(t.upvote_order_id) : null;

    let commentMatch: { id: number; created_at: string; link: string; content: string } | null = null;
    if (!up && t.comment_order_id) {
      commentMatch = commentOrdersById.get(t.comment_order_id) || null;
    } else if (!up && wantsLegacyCommentCorrelation && legacyCommentOrders.length > 0) {
      const d = (t.description || "").toLowerCase();
      const looksComment = t.type === "purchase" && (d.includes("comment") || d.includes("comments"));
      if (looksComment) {
        const tMs = Date.parse(t.created_at);
        let best: { o: (typeof legacyCommentOrders)[number]; diff: number } | null = null;
        for (const o of legacyCommentOrders) {
          const diff = Math.abs(Date.parse(o.created_at) - tMs);
          if (diff > 10 * 60 * 1000) continue; // within 10 minutes
          if (!best || diff < best.diff) best = { o, diff };
        }
        commentMatch = best?.o || null;
      }
    }

    const order =
      up
        ? {
            kind: "upvote",
            order_type: serviceLabel(up.service),
            quantity: up.quantity ?? null,
            link: up.link ?? null,
            subreddit: parseSubreddit(up.link),
            service: up.service ?? null,
            speed: up.speed ?? null,
            order_status: up.status ?? null,
          }
        : commentMatch
          ? {
              kind: "comment",
              order_type: "Comments",
              quantity: 1,
              link: commentMatch.link ?? null,
              subreddit: parseSubreddit(commentMatch.link),
              comment_order_id: commentMatch.id,
            }
          : null;

    return { ...t, order };
  });

  return json(200, { ok: true, transactions: enriched, count: count ?? null, limit, offset });
});

