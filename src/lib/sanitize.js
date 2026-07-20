// ============================================================
// INVARIANT I7 — THE SANITIZER
// Every piece of HTML/CSS that renders inside a KOY page block
// passes through this module. HUMAN INPUT AND KOY AI OUTPUT TAKE
// THE SAME PATH — there is no privileged route around this file.
// Treat every input as if a hostile stranger wrote it.
//
// Defense in depth (both layers required, neither is optional):
//   Layer 1: DOMPurify strict allowlist (this module)
//   Layer 2: render ONLY inside <iframe sandbox=""> (no scripts,
//            no same-origin, no forms, no popups) — see the
//            "html" branch in App.jsx BI()
// ============================================================

import DOMPurify from "dompurify";

// Presentation-only tags. No script, no iframe, no object/embed,
// no form controls, no svg/mathml (XSS-namespace hazards).
var ALLOWED_TAGS = ["a", "b", "i", "em", "strong", "u", "s", "p", "div", "span", "br", "hr",
  "ul", "ol", "li", "h1", "h2", "h3", "h4", "h5", "h6", "img", "blockquote", "code", "pre",
  "small", "sub", "sup", "table", "thead", "tbody", "tr", "td", "th", "marquee", "center",
  "figure", "figcaption"];

// No event handlers (on*) — DOMPurify strips them, and they're not
// in this list anyway. style attributes are allowed because the only
// render surface is the sandboxed iframe (Layer 2).
var ALLOWED_ATTR = ["href", "src", "alt", "title", "style", "width", "height", "align", "target", "rel"];

// URLs: https, inline data-images, or same-origin absolute paths. No http:,
// no javascript:, no data:text/html, no protocol-relative //host.
var URI_ALLOW = /^(?:https:|data:image\/(?:png|jpe?g|gif|webp);base64,|\/(?!\/))/i;

export var MAX_HTML = 20000; // chars — keep blocks small; budgets are part of the invariant
export var MAX_CSS = 20000;

export function sanitizeHtml(html) {
  if (typeof html !== "string" || !html) return "";
  return DOMPurify.sanitize(html.slice(0, MAX_HTML), {
    ALLOWED_TAGS: ALLOWED_TAGS,
    ALLOWED_ATTR: ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    ALLOWED_URI_REGEXP: URI_ALLOW,
  });
}

// CSS is text-filtered (v1): no @import (external fetch), no expression()
// (legacy IE script vector), no javascript: URLs, and url(...) only for
// data-images / https. The sandboxed iframe means CSS cannot script, but
// external url() fetches would still leak viewer IPs to arbitrary hosts —
// so they are neutralized here.
export function sanitizeCss(css) {
  if (typeof css !== "string" || !css) return "";
  return css.slice(0, MAX_CSS)
    .replace(/@import[^;]*;?/gi, "")
    .replace(/expression\s*\(/gi, "blocked(")
    .replace(/javascript\s*:/gi, "blocked:")
    .replace(/url\s*\(\s*(['"]?)(?!data:image\/|https:\/\/)/gi, "url($1about:invalid#");
}

// The only legal way to build the iframe srcdoc. Callers must render the
// result in <iframe sandbox=""> — never into the live DOM.
export function composeSrcdoc(html, css) {
  return "<!doctype html><html><head><meta charset=\"utf-8\"><style>html,body{margin:0;padding:0;overflow:hidden}" +
    sanitizeCss(css) +
    "</style></head><body>" +
    sanitizeHtml(html) +
    "</body></html>";
}
