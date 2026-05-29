import { useState, useEffect, useRef } from "react";
import "./styles/koy-tokens.css";
import "./styles/koy-landing.css";

/* Koy Landing — Sprint 2.5 Phase B. Shipped independently of the Sprint 3
   auth/state refactor. Lives on its own route; the auth/Editor front door
   ("/") is untouched. CSS is class-namespaced (.kl-*) so it cannot bleed
   into the inline-styled Editor.
   Beat 3: B1 layout + B2 copy.  Beat 4: B3 rip (video -> static + breath).
   B5: 3-tile portal constellation (wake / hover / tap / long-press) per
       B1 v1.1 reconciliation.  Beat 5 (B4 spread) still held. */

var FONTS = "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=Space+Mono:wght@400;700&display=swap";
var STATIC_MARK = "/koy-rip-static-final-frame-v2.jpg";
var RIP_MOTION = "/koy-rip-motion-v2-CANON.mp4";
var SPREAD_LANDSCAPE = "/koy-spread-motion-landscape-v1.mp4";

/* B3 storage contract: single boolean, sessionStorage backend (rip is a
   per-session event — plays once, recovers to the static steady state).
   Set on rip-completion, user-skip, or reduced-motion. NOT set on
   asset-load failure, so a later visit under better conditions can retry. */
function ripSeen() { try { return sessionStorage.getItem("koy.landing.rip.seen") === "1"; } catch (e) { return false; } }
function markRipSeen() { try { sessionStorage.setItem("koy.landing.rip.seen", "1"); } catch (e) {} }
function reducedMotion() { try { return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches); } catch (e) { return false; } }

/* B5 decorative ticker rows for the Bloomberg portal fragment (aria-hidden). */
var BLOOMBERG_ROWS = [
  ["AAPL", "+1.24", false],
  ["TSLA", "-0.88", true],
  ["NVDA", "+3.10", false],
  ["MSFT", "+0.42", false],
  ["GME", "-2.15", true],
  ["DOGE", "+0.07", false]
];

function Landing() {
  // B3 rip: first visit plays the motion, then settles to the static mark
  // (which breathes via .kl-mark-rest). Seen / reduced-motion open settled.
  var [settled, setSettled] = useState(function () { return ripSeen() || reducedMotion(); });
  // B4 spread (v4.4 cascade): data-state="settled" on .kl root once the
  // spread video ends or errors (Path C deferred-asset: onError fires
  // immediately when the MP4 is absent — silent slot reservation, ambient
  // field reveals via CSS, hotspot wake becomes eligible).
  var [bridgeSettled, setBridgeSettled] = useState(false);
  var hotspotsRef = useRef(null);
  var ripVideoRef = useRef(null);

  function settle(setFlag) { if (setFlag) markRipSeen(); setSettled(true); }
  function settleBridge() { setBridgeSettled(true); }

  useEffect(function () {
    if (ripSeen() || reducedMotion()) { markRipSeen(); return; }
    function onKey(e) { if (e.key === "Escape") settle(true); }
    window.addEventListener("keydown", onKey);
    return function () { window.removeEventListener("keydown", onKey); };
  }, []);

  /* iOS autoplay-kick. Safari (esp. low-power mode + in-app browsers)
     blocks autoplay even with autoplay+muted+playsinline set. Explicit
     play() returns a promise; on rejection, wait for the first user
     gesture on the landing root and kick play() then. Skip affordance
     still works as a backup. */
  useEffect(function () {
    if (settled) return;
    var v = ripVideoRef.current;
    if (!v) return;
    function kickPlay() {
      var p = v.play();
      if (p && typeof p.catch === "function") p.catch(function () {});
    }
    kickPlay();
    var root = v.closest(".kl");
    if (!root) return;
    function gestureKick() { kickPlay(); }
    root.addEventListener("touchstart", gestureKick, { once: true, passive: true });
    root.addEventListener("click", gestureKick, { once: true });
    return function () {
      root.removeEventListener("touchstart", gestureKick);
      root.removeEventListener("click", gestureKick);
    };
  }, [settled]);

  /* B5 orchestrator — lifted from B5 preview script-0, .kl-constellation
     reconciled to .kl-hotspots per B1 v1.1 patch Q2. Runs once on mount;
     state classes (is-woken / is-tap-in-flight / has-tap) live on the
     .kl-hotspots wrapper. Cleans up its IO + listeners + timers on unmount. */
  useEffect(function () {
    var root = hotspotsRef.current;
    if (!root) return;
    var tiles = root.querySelectorAll(".kl-hotspot");
    var ac = new AbortController();
    var sig = ac.signal;
    var timers = [];
    function later(fn, ms) { var id = setTimeout(fn, ms); timers.push(id); return id; }

    var io = new IntersectionObserver(function (entries, obs) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) {
          root.classList.add("is-woken");
          obs.disconnect();
          break;
        }
      }
    }, { threshold: 0.4 });
    io.observe(root);

    function fireTap(tile) {
      if (tile.dataset.template === "pending") return fireGraceful(tile);
      if (root.classList.contains("is-tap-in-flight")) return;
      root.classList.add("is-tap-in-flight", "has-tap");

      var r = tile.getBoundingClientRect();
      tile.style.setProperty("--tx", ((window.innerWidth / 2) - (r.left + r.width / 2)) + "px");
      tile.style.setProperty("--ty", ((window.innerHeight / 2) - (r.top + r.height / 2)) + "px");
      tile.style.setProperty("--scale", Math.max(window.innerWidth / r.width, window.innerHeight / r.height) * 1.05);

      tile.classList.add("is-tapping");
      later(function () { tile.classList.add("is-expanding"); }, 120);
      later(function () { tile.classList.add("is-dissolving"); }, 600);
      later(function () {
        tile.dispatchEvent(new CustomEvent("koy:template:enter", {
          bubbles: true,
          detail: { template: tile.dataset.template }
        }));
      }, 700);
    }

    function fireGraceful(tile) {
      if (root.classList.contains("is-tap-in-flight")) return;
      root.classList.add("is-tap-in-flight", "has-tap");
      tile.classList.add("is-graceful");
      later(function () {
        tile.classList.remove("is-graceful");
        root.classList.remove("is-tap-in-flight", "has-tap");
      }, 1400);
    }

    function bindLongPress(tile) {
      var timer, x0 = 0, y0 = 0;
      tile.addEventListener("touchstart", function (e) {
        if (tile.dataset.template === "pending") return;
        x0 = e.touches[0].clientX; y0 = e.touches[0].clientY;
        timer = setTimeout(function () {
          tile.classList.add("is-previewing");
          if (navigator.vibrate) navigator.vibrate(15);
        }, 400);
        timers.push(timer);
      }, { passive: true, signal: sig });
      tile.addEventListener("touchmove", function (e) {
        var t = e.touches[0];
        if (Math.hypot(t.clientX - x0, t.clientY - y0) > 12) {
          clearTimeout(timer);
          tile.classList.remove("is-previewing");
        }
      }, { passive: true, signal: sig });
      tile.addEventListener("touchend", function () {
        clearTimeout(timer);
        var was = tile.classList.contains("is-previewing");
        tile.classList.remove("is-previewing");
        if (was) fireTap(tile);
      }, { signal: sig });
      tile.addEventListener("touchcancel", function () {
        clearTimeout(timer);
        tile.classList.remove("is-previewing");
      }, { signal: sig });
      tile.addEventListener("contextmenu", function (e) { e.preventDefault(); }, { signal: sig });
    }

    tiles.forEach(function (tile) {
      tile.addEventListener("click", function () { fireTap(tile); }, { signal: sig });
      tile.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fireTap(tile); }
      }, { signal: sig });
      bindLongPress(tile);
    });

    return function () {
      ac.abort();
      io.disconnect();
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <div className="kl" data-state={bridgeSettled ? "settled" : undefined}>
      <link href={FONTS} rel="stylesheet" />
      <div className="kl-scroll-progress" aria-hidden="true"></div>

      <nav className="kl-nav" aria-label="Landing">
        <div className="kl-nav__brand-slot" aria-label="Koy">
          <img src={STATIC_MARK} alt="Koy" width="36" height="36" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} />
        </div>
        <div></div>
        <a className="kl-nav__route" href="/">Sign in</a>
      </nav>

      <section className="kl-hero">
        <div className="kl-hero__rip-slot">
          {settled ? (
            <img src={STATIC_MARK} alt="Koy" className="kl-mark-rest" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          ) : (
            <video
              ref={ripVideoRef}
              src={RIP_MOTION}
              autoPlay
              muted
              playsInline
              preload="auto"
              onEnded={function () { settle(true); }}
              onError={function () { settle(false); }}
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          )}
        </div>

        <div className="kl-hero__copy-slot">
          <h1 className="kl-hero__phrase"></h1>
        </div>

        <div className="kl-hero__cue" aria-hidden="true">
          <span className="kl-hero__cue-line"></span>
          <span className="kl-hero__cue-label">Scroll</span>
        </div>

        {/* Skip — present from t=0 (no fade, Rule #9); jumps straight to settled */}
        {settled ? null : (
          <button
            type="button"
            onClick={function () { settle(true); }}
            aria-label="Skip intro"
            style={{ position: "absolute", right: "var(--s-5)", bottom: "var(--s-5)", background: "transparent", border: "1px solid var(--line)", color: "var(--fg-faint)", font: "var(--t-xs)/1 var(--font-mono)", letterSpacing: "var(--track-caps)", textTransform: "uppercase", padding: "6px 10px", borderRadius: "var(--r-2)", cursor: "pointer" }}
          >
            Skip
          </button>
        )}
      </section>

      {/* B4 spread (Path C deferred-asset). Unconditional <video>: on
          successful play it ends and fires onEnded; in deferred-asset
          (MP4 absent) onError fires immediately. Either path settles the
          .kl root, revealing the ambient field + becoming wake-eligible.
          When the spread MP4 lands, no code change — drop the file into
          public/ at the specced filename and the slot resolves. */}
      <div className="kl-slime-band" aria-hidden="true">
        <video
          className="kl-spread"
          src={SPREAD_LANDSCAPE}
          autoPlay
          muted
          playsInline
          preload="auto"
          onEnded={settleBridge}
          onError={settleBridge}
        />
      </div>

      {/* B5 — 3-tile portal constellation. Orchestrator (above) binds to this
          section via hotspotsRef; wake/tap/long-press classes land here. */}
      <section className="kl-hotspots" aria-label="Templates" ref={hotspotsRef}>
        <header className="kl-hotspots__head">
          <h2 className="kl-hotspots__title">A page for every you.</h2>
          <span className="kl-hotspots__count">3 · vibes at launch</span>
        </header>

        <button className="kl-hotspot" type="button" data-template="bloomberg"
          aria-label="Enter Bloomberg template — terminal-style page for traders and creators">
          <span className="kl-frag kl-frag--bloomberg" aria-hidden="true">
            <span className="kl-frag__rows">
              {BLOOMBERG_ROWS.map(function (row) {
                return (
                  <span className="kl-frag__row" key={row[0]}>
                    <span>{row[0]}</span>
                    <span className={row[2] ? "neg" : undefined}>{row[1]}</span>
                  </span>
                );
              })}
              <span className="kl-frag__row">
                <span>&gt;_</span>
                <span className="kl-frag__cursor"></span>
              </span>
            </span>
          </span>
        </button>

        <button className="kl-hotspot" type="button" data-template="glam"
          aria-label="Enter Glam Girl template — Y2K maximalist page for self-expression">
          <span className="kl-frag kl-frag--glam" aria-hidden="true">
            <span className="kl-frag__orb"></span>
            <span className="kl-frag__sparkle kl-frag__sparkle--a"></span>
            <span className="kl-frag__sparkle kl-frag__sparkle--b"></span>
            <span className="kl-frag__sparkle kl-frag__sparkle--c"></span>
          </span>
        </button>

        <button className="kl-hotspot" type="button" data-template="pending"
          data-coming-soon="Coming soon · vibe TBD"
          aria-label="Third template slot — coming soon, vibe to be announced">
          <span className="kl-frag kl-frag--pending" aria-hidden="true">
            <span className="kl-frag__label">slot 3<br /><b>TBD</b></span>
          </span>
        </button>
      </section>

      <section className="kl-bridge" aria-label="Browse all templates">
        <span className="kl-bridge__seam" aria-hidden="true"></span>
        <span className="kl-bridge__cue">Phase C · gallery handoff</span>
        <a className="kl-bridge__cta">Browse every template →</a>
      </section>
    </div>
  );
}

export default Landing;
