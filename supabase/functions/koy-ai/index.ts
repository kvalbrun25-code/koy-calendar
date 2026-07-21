// ============================================================
// KOY AI v1 — the leased brain. (Sprint 5 / KOY-AI-BRIEF.md)
//
// Writes HTML + CSS ONLY. Its output is UNTRUSTED by design:
// the client renders it through the exact same sanitizer (I7)
// and sandboxed iframe as human-pasted code. No shortcuts, ever.
//
// Deploy notes (founder-gated):
//   - Secret: ANTHROPIC_API_KEY must be set on the Supabase project
//     (Dashboard -> Edge Functions -> Secrets). NEVER in the client.
//   - verify_jwt stays ON (default): only logged-in KOY users can
//     call this, so anon traffic can't burn credits.
//   - Model: claude-haiku (fast/cheap) — founder can upgrade later.
// ============================================================

const SYSTEM = [
  "You are KOY AI, the page-builder assistant inside KOY — a free-form personal page app.",
  "The user describes a visual block for their page. You return ONLY a JSON object:",
  '{"html": "<...>", "css": "..."}',
  "Rules:",
  "- HTML + CSS only. NEVER JavaScript, <script>, event handlers, iframes, forms, or external resources.",
  "- Only https: or data:image URLs if any. Prefer pure-CSS visuals (gradients, shadows, animations).",
  "- CSS animations/transitions are encouraged — sparkle, glow, float, marquee vibes are welcome.",
  "- Keep it under 4KB total. Self-contained: style only elements you created, using classes prefixed koy-.",
  "- The block renders in a small frame the user sizes themselves; use width:100%/height:100% roots.",
  "- Match the user's requested vibe exactly. Maximalism is allowed. This is MySpace energy, not corporate.",
  "- If the user asks for JavaScript, interactivity with logic, clickable behavior, forms that submit, counters, API calls, or anything that needs a <script> — DO NOT attempt it and DO NOT fake it. Instead return exactly {\"decline\": \"<one friendly sentence: KOY AI writes HTML + CSS for now; moving parts (JavaScript) are coming later; offer to make the LOOK of it in CSS instead>\"}. Pure-CSS motion (hover, glow, float, marquee, spin) is NOT JavaScript and is always fine.",
  "- Output the JSON object and NOTHING else. No markdown fences, no commentary.",
].join("\n");

function json(body: unknown, status: number, extra: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...extra },
  });
}

Deno.serve(async (req: Request) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method" }, 405, cors);

  // Defense in depth: even though Supabase's verify_jwt gate should reject
  // anon calls, refuse anything without a bearer token — so a deploy that
  // accidentally ships --no-verify-jwt is not a full anonymous bypass.
  // (Reviewer finding: a misdeploy shouldn't open an anon credit-burn hole.)
  const authz = req.headers.get("authorization") || "";
  if (!/^Bearer\s+.+/i.test(authz)) return json({ error: "unauthorized" }, 401, cors);

  let prompt = "";
  try {
    const body = await req.json();
    prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
  } catch (_) { /* fall through */ }
  if (!prompt || prompt.length > 500) return json({ error: "bad prompt" }, 400, cors);

  const key = Deno.env.get("ANTHROPIC_API_KEY");
  if (!key) return json({ error: "KOY AI not configured" }, 503, cors);

  // Credits = rate limiter. Spend one BEFORE calling Anthropic (atomic, keyed
  // off the caller's JWT via the spend_ai_credit RPC, granted to authenticated).
  // No credit -> 402, no model call, no spend. This bounds the Anthropic bill.
  const sbUrl = Deno.env.get("SUPABASE_URL");
  const sbAnon = Deno.env.get("SUPABASE_ANON_KEY");
  const sbSvc = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  async function spend(): Promise<number | null> {
    if (!sbUrl || !sbAnon) return null;
    try {
      const rr = await fetch(sbUrl + "/rest/v1/rpc/spend_ai_credit", {
        method: "POST",
        headers: { apikey: sbAnon, Authorization: authz, "Content-Type": "application/json" },
        body: "{}",
      });
      if (!rr.ok) return null;
      return await rr.json();
    } catch (_) { return null; }
  }

  // JWT sub = the caller's user id (token already verified by the gateway).
  function jwtSub(bearer: string): string | null {
    try {
      let p = bearer.replace(/^Bearer\s+/i, "").split(".")[1];
      p = p.replace(/-/g, "+").replace(/_/g, "/");
      while (p.length % 4) p += "=";
      const j = JSON.parse(atob(p));
      return typeof j.sub === "string" ? j.sub : null;
    } catch (_) { return null; }
  }
  const uid = jwtSub(authz);

  // Refund is SERVICE-ROLE ONLY (never client-callable — a public refund RPC is
  // an infinite-credit printer). Called only here, only for genuine INFRA
  // failures (Anthropic 5xx / network). Model-produced outcomes are NOT refunded.
  async function refund(): Promise<void> {
    if (!sbUrl || !sbSvc || !uid) return;
    try {
      await fetch(sbUrl + "/rest/v1/rpc/refund_ai_credit", {
        method: "POST",
        headers: { apikey: sbSvc, Authorization: "Bearer " + sbSvc, "Content-Type": "application/json" },
        body: JSON.stringify({ p_uid: uid }),
      });
    } catch (_) { /* best effort */ }
  }

  const remaining = await spend();
  if (remaining === null) return json({ error: "credit check failed" }, 502, cors);
  if (remaining < 0) return json({ error: "out_of_credits" }, 402, cors);

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: Deno.env.get("KOY_AI_MODEL") || "claude-haiku-4-5",
        max_tokens: 2000,
        system: SYSTEM,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    // Refund ONLY genuine infra failures (Anthropic 5xx / overload / network) —
    // there Anthropic didn't bill and the user got nothing. A model that DID
    // respond (decline / junk / empty) is a billed call and is NOT refunded,
    // otherwise a user could spam refunded-but-billable calls for free.
    if (!r.ok) { await refund(); return json({ error: "upstream " + r.status }, 502, cors); }
    const data = await r.json();
    const text: string = data?.content?.[0]?.text ?? "";
    // tolerate stray fences/prose: grab the outermost JSON object
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return json({ error: "no_result", credits: remaining }, 200, cors);
    const out = JSON.parse(m[0]);
    // Graceful JS decline: the model returns {decline:"..."} for JS/interactivity.
    // It's a real (billed) response, so it is charged — report current balance.
    if (typeof out.decline === "string" && out.decline.trim()) {
      return json({ decline: out.decline.slice(0, 300), credits: remaining }, 200, cors);
    }
    const html = typeof out.html === "string" ? out.html.slice(0, 8000) : "";
    const css = typeof out.css === "string" ? out.css.slice(0, 8000) : "";
    if (!html && !css) return json({ error: "no_result", credits: remaining }, 200, cors);
    // NOTE: no sanitizing here on purpose — the CLIENT sanitizer (I7) is the
    // single source of truth. Server-side pre-cleaning would tempt someone to
    // trust it and skip the client layer. One filter, one owner.
    return json({ html, css, credits: remaining }, 200, cors);
  } catch (_e) {
    await refund();
    return json({ error: "koy ai error" }, 500, cors);
  }
});
