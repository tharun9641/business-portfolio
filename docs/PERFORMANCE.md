# Performance, accessibility and cross-browser evidence (Phase 5)

All measurements are against the production build (`next build && next start`), 2026-10-18. Raw reports are in `docs/qa/phase-5/`.

## Lighthouse

Lighthouse 12. "mobile" is the default slow 4G with 4× CPU; "desktop" is the desktop preset.

| Run         | Perf | A11y | Best practices | SEO | LCP (simulated) | LCP (observed) | CLS | TBT   |
| ----------- | ---- | ---- | -------------- | --- | --------------- | -------------- | --- | ----- |
| desktop     | 100  | 100  | 100            | 100 | 0.8 s           | 241 ms         | 0   | 0 ms  |
| mobile-run1 | 89   | 100  | 100            | 100 | 3.8 s           | 222 ms         | 0   | 50 ms |
| mobile-run2 | 90   | 100  | 100            | 100 | 3.6 s           | 220 ms         | 0   | 70 ms |
| mobile-run3 | 90   | 100  | 100            | 100 | 3.6 s           | 224 ms         | 0   | 70 ms |

**Targets:** Performance ≥ 90 desktop / ≥ 80 mobile, and ≥ 95 for the other three categories.

- Met: desktop **100**, mobile **83–90**; all other categories **100** on both.
- Also met: **CLS 0** and **TBT ≤ 110 ms**.

**Not met: LCP < 2.5 s on simulated 4G.**

- Lighthouse's _simulated_ mobile LCP is 3.6–4.6 s. The _observed_ LCP is 57–281 ms, and the LCP element is the hero sky layer (11 KB).
- The simulation (Lantern) charges every request started before LCP to it. That is mainly the ~200 KB of initial JavaScript (React/Next ≈ 110 KB, GSAP + ScrollTrigger + SplitText ≈ 54 KB) and 71 KB of fonts.
- Getting under 2.5 s in the simulation would mean taking GSAP off the first load, which the hero needs to be interactive. **Decision for the PM:** accept the gap, or start the hero sequence after GSAP loads lazily (motion would start roughly 1 s later on slow connections).

## What changed to get here

| Change                                                                                         | Effect                           |
| ---------------------------------------------------------------------------------------------- | -------------------------------- |
| Arrival fade is a CSS `--ink` curtain over a fully painted scene (not JS opacity on the image) | LCP image painted on first frame |
| Motion library only in the on-demand menu panel; CTA hover/press in CSS                        | −45 KB gz from first load        |
| 3D chunk (969 KB raw) mounted only near the Eye; parsed on first scroll                        | off the critical path            |
| Below-fold images (`NearImage`) requested within one screen of view                            | −140 KB on first load            |
| Mist bands 1920→1024 px, WebP q55 (blurred anyway)                                             | 272 KB → 55 KB                   |
| Fonts trimmed to Cormorant 400/500 + Hanken variable                                           | −40 KB                           |
| Hero layers q60, portrait `sizes` 160vw, preload only 4 dominant layers                        | fewer, smaller first-frame bytes |
| Total first-load weight                                                                        | **1,232 KB → 408 KB**            |

## Scroll trace

Measured on an Apple M5 (Metal GPU), 1440×900, `?tier=high` (3D wheel). The full page is scrolled with 160 wheel steps.

| Run | Avg FPS | p95 frame | Worst frame | Long tasks            |
| --- | ------- | --------- | ----------- | --------------------- |
| 1   | 58.2    | 16.7 ms   | 333.3 ms    | 116 ms, 82 ms, 308 ms |
| 2   | 59.5    | 16.7 ms   | 100 ms      | 94 ms                 |
| 3   | 59.3    | 16.7 ms   | 100.1 ms    | 105 ms                |

**Target:** sustained ~60 fps. Met: 58–59.5 fps average, p95 16.7 ms.

**Target:** no long tasks over 100 ms. Not fully met:

- The 3D wheel's GPU setup (shader compile plus environment map), a screen before the Eye, takes **94–116 ms** once.
- On a cold cache, the first scroll also parses three.js once (**~308 ms**).
- Mitigations already in place: shared capsule geometry, a 128 px environment map, and the chunk prefetched on first scroll.
- Further option: a staged warm-up (`compileAsync`) during the hero pin.

## Accessibility

- **axe-core** (WCAG 2.0/2.1/2.2 A + AA): **0 violations** at 375 and 1440 (`axe-*.json`).
- Fixed along the way: CTA text on `--bus` is now white (5.7:1; stone was 4.4:1).
- **Text over imagery** (glyph-tight box, 95th-percentile brightest background):
- #top h1: 9.33 (needs 3)
- #top [data-hero-copy] p: 8.68 (needs 4.5)
- #process h2: 7.19 (needs 3)
- #process [data-eye-panel][data-active] [data-eye-body]: 5.50 (needs 4.5)
- #process [data-eye-panel][data-active] h3: 6.08 (needs 3)
- #contact h2: 10.25 (needs 3)
- #contact h2 + div p: 11.30 (needs 4.5)
- **Keyboard:**
  - the skip link is the first tab stop and becomes visible;
  - the focus ring is visible on all controls;
  - the menu traps focus and closes on Esc;
  - the Eye tabs move with the arrow keys (roving tabindex).
- **Reduced motion:** no smooth scroll, pinning or parallax. The hero shows a still and the Eye shows a list.

## Cross-browser

Chromium, WebKit (Safari engine) and Firefox at 375 / 768 / 1280 / 1920: **15/15 pass** (`playwright.cross.config.ts`). Each run checks:

- the hero renders;
- the bascules lift by mid-pin;
- the Eye boards stop 3;
- the contact band renders;
- the form validates and sends;
- there are no page errors.

Screenshots are in `docs/qa/phase-5/cross/`. One fix came out of this pass: tablets in portrait now get the arc-on-top Eye layout (D-44).
