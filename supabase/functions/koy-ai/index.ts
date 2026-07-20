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
    if (!r.ok) return json({ error: "upstream " + r.status }, 502, cors);
    const data = await r.json();
    const text: string = data?.content?.[0]?.text ?? "";
    // tolerate stray fences/prose: grab the outermost JSON object
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return json({ error: "no json" }, 502, cors);
    const out = JSON.parse(m[0]);
    const html = typeof out.html === "string" ? out.html.slice(0, 8000) : "";
    const css = typeof out.css === "string" ? out.css.slice(0, 8000) : "";
    if (!html && !css) return json({ error: "empty" }, 502, cors);
    // NOTE: no sanitizing here on purpose — the CLIENT sanitizer (I7) is the
    // single source of truth. Server-side pre-cleaning would tempt someone to
    // trust it and skip the client layer. One filter, one owner.
    return json({ html, css }, 200, cors);
  } catch (_e) {
    return json({ error: "koy ai error" }, 500, cors);
  }
});
