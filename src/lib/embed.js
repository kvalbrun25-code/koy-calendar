// ============================================================
// EMBED RESOLVER (Sprint 6)
// A pasted link is UNTRUSTED. We never put a user URL straight into
// an iframe src. Instead we match it against a provider ALLOWLIST and
// build the embed URL OURSELVES from the extracted id. Anything that
// doesn't match a known provider is rejected — no raw iframe, ever.
//
// Returns { kind, src, provider } or null.
//   kind "iframe" -> render in a sandboxed player iframe
//   kind "img"    -> render as <img> (direct image/gif)
// ============================================================

function ytId(u) {
  var m = u.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : null;
}

// Each provider: test the host, extract the id, build OUR embed url.
var PROVIDERS = [
  {
    name: "youtube",
    match: function (u) {
      var id = ytId(u);
      return id ? "https://www.youtube-nocookie.com/embed/" + id + "?rel=0" : null;
    },
  },
  {
    name: "spotify",
    match: function (u) {
      var m = u.match(/open\.spotify\.com\/(track|album|playlist|episode|show|artist)\/([A-Za-z0-9]+)/);
      return m ? "https://open.spotify.com/embed/" + m[1] + "/" + m[2] : null;
    },
  },
  {
    name: "soundcloud",
    match: function (u) {
      // Only accept canonical soundcloud.com track/set URLs; we build the
      // player URL and pass the ORIGINAL as an encoded param (SoundCloud's
      // documented embed contract). Host is checked, not trusted verbatim.
      return /^https:\/\/(?:www\.)?soundcloud\.com\/[\w-]+\/[\w-]+/.test(u)
        ? "https://w.soundcloud.com/player/?url=" + encodeURIComponent(u) + "&color=%23ff5500"
        : null;
    },
  },
  {
    name: "vimeo",
    match: function (u) {
      var m = u.match(/vimeo\.com\/(?:video\/)?(\d+)/);
      return m ? "https://player.vimeo.com/video/" + m[1] : null;
    },
  },
];

export function resolveEmbed(url) {
  if (typeof url !== "string") return null;
  var u = url.trim();
  if (!u) return null;
  // Must be a clean https URL. No javascript:, data:, http:, protocol-relative.
  if (!/^https:\/\//i.test(u)) return null;
  if (u.length > 600) return null;

  for (var i = 0; i < PROVIDERS.length; i++) {
    var src = PROVIDERS[i].match(u);
    if (src) return { kind: "iframe", src: src, provider: PROVIDERS[i].name };
  }
  // Direct image / gif (https only, known extensions).
  if (/^https:\/\/[^\s]+\.(png|jpe?g|gif|webp|avif)(\?[^\s]*)?$/i.test(u)) {
    return { kind: "img", src: u, provider: "image" };
  }
  return null;
}

export var EMBED_PROVIDERS = "YouTube · Spotify · SoundCloud · Vimeo · image/GIF links";
