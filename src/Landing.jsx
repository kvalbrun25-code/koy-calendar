import { useState, useEffect, useRef } from "react";
import "./styles/koy-tokens.css";
import "./styles/koy-landing.css";

/* Koy Landing — Sprint 2.5 Phase B. Shipped independently of the Sprint 3
   auth/state refactor. Lives on its own route; the auth/Editor front door
   ("/") is untouched. CSS is class-namespaced (.kl-*) so it cannot bleed
   into the inline-styled Editor.
   Beat 3: B1 layout + B2 copy. Beat 4: B3 rip (video -> static + breath).
   B4 spread + B5 constellation behavior held pending CD's CSS resolution. */

var FONTS = "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=Space+Mono:wght@400;700&display=swap";
var STATIC_MARK = "/koy-rip-static-final-frame-v2.jpg";

/* B1 hotspot grid · stand-in labels (Phase C names per spec). B5 fills
   interaction/wake behavior once its CSS layer lands. */
var HOTSPOTS = [
  { num: "01", tag: "Purpose",  label: "the page" },
  { num: "02", tag: "Vibe",     label: "the zine" },
  { num: "03", tag: "Commerce", label: "the shop" },
  { num: "04", tag: "Purpose",  label: "the link" },
  { num: "05", tag: "Vibe",     label: "the manifesto" },
  { num: "06", tag: "Commerce", label: "the pre-order" }
];

function Landing() {
  return (
    <div className="kl">
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
          <img src={STATIC_MARK} alt="Koy" className="kl-mark-rest" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </div>

        <div className="kl-hero__copy-slot">
          <h1 className="kl-hero__phrase">this is mine.</h1>
        </div>

        <div className="kl-hero__cue" aria-hidden="true">
          <span className="kl-hero__cue-line"></span>
          <span className="kl-hero__cue-label">Scroll</span>
        </div>
      </section>

      {/* B4 slime band — B1 reserves the rhythm. Spread video + settled
          behavior held: that CSS layer is not in production koy-landing.css. */}
      <div className="kl-slime-band" aria-hidden="true"></div>

      <section className="kl-hotspots" aria-label="Templates">
        <header className="kl-hotspots__head">
          <h2 className="kl-hotspots__title">A page for every you.</h2>
          <span className="kl-hotspots__count">6 templates</span>
        </header>

        {HOTSPOTS.map(function (h) {
          return (
            <a className="kl-hotspot" key={h.num}>
              <div className="kl-hotspot__head">
                <span className="kl-hotspot__num">{h.num}</span>
                <span className="kl-hotspot__tag">{h.tag}</span>
              </div>
              <div className="kl-hotspot__preview"></div>
              <div className="kl-hotspot__foot">
                <span className="kl-hotspot__label">{h.label}</span>
                <span className="kl-hotspot__sub">Phase C names</span>
              </div>
            </a>
          );
        })}
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
