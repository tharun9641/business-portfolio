# Motion system

The constants live in `src/lib/motion.ts`. The CSS mirrors are in `src/styles/tokens.css`.

## Tokens

| Token               | Value        | Use                                                                                        |
| ------------------- | ------------ | ------------------------------------------------------------------------------------------ |
| `EASE.entrance`     | `power3.out` | Entrances (Reveal, SplitHeading, MaskReveal)                                               |
| `EASE.scene`        | `expo.inOut` | Scene-to-scene transitions (Phase 3+)                                                      |
| `EASE.scrub`        | `none`       | Scrubbed timelines                                                                         |
| `DURATION.micro`    | 0.6 s        | Buttons, menu, hover                                                                       |
| `DURATION.entrance` | 1.2 s        | Entrances                                                                                  |
| `SCRUB`             | 1            | ScrollTrigger scrub smoothing                                                              |
| `PARALLAX_FACTOR`   | 0.25         | Layer travel = depth × scene height × factor (shared across the scene's full scroll range) |
| `POINTER_MAX`       | 12 px        | Pointer offset on a depth-1 layer (`high` tier, fine pointer only)                         |
| `STAGGER.lines`     | 0.08 s       | SplitText line stagger                                                                     |

## Engine

- **Lenis**: one instance in `SmoothScrollProvider`, driven by `gsap.ticker`. `lenis.on('scroll', ScrollTrigger.update)`, `gsap.ticker.lagSmoothing(0)`, `autoRaf: false`. Anchor links scroll through Lenis.
- **GSAP**: plugins are registered once in `src/lib/gsap.ts`. Every animated component uses `useGSAP` with a scope and wraps its timelines in `gsap.matchMedia('(prefers-reduced-motion: no-preference)')`. Under reduced motion nothing is created, and switching the OS setting reverts animations live.
- **Motion** (the library): UI micro-interactions only (Button, Nav menu), under `MotionConfig reducedMotion="user"`.

## Primitives

| Component             | What it does                                                                                                                                                              |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ParallaxScene`       | Section wrapper. One ScrollTrigger (`top bottom` → `bottom top`, scrub) drives every layer. `will-change` is set only while active. Pointer parallax uses `gsap.quickTo`. |
| `ParallaxLayer depth` | The outer box takes the scroll `y`, the inner box takes the pointer `x/y`. Overscan is calculated from depth so edges never show.                                         |
| `SplitHeading`        | SplitText `lines` with `mask: 'lines'` and `autoSplit` (re-splits on resize and font load). Keeps an aria-label with the full text.                                       |
| `Reveal`              | Fade and rise by 32 px.                                                                                                                                                   |
| `MaskReveal`          | `clip-path` wipe-up, a 1.18 → 1 settle, then inner parallax while scrolling.                                                                                              |
| `MistLayer`           | Ambient loop: a CSS `translate3d` over one tileable band (90 s per tile). Stops under reduced motion.                                                                     |

## No flash before hydration

`layout.tsx` adds `.js` to `<html>` with an inline script before first paint. CSS hides `[data-reveal]` only when JS is on and motion is allowed. A 4 s CSS failsafe reveals content if a script never runs its entrance.

## Reduced motion

No Lenis, no pinning, no parallax, no loops. Scenes render their composed frame (or `staticFrame`), and all content stays readable in DOM order. This is verified by `tests/qa/phase.spec.ts`.

## Device tiers

`classifyTier()` (unit-tested in `deviceTier.test.ts`) puts devices into tiers:

- **low:** no WebGL, a software GPU, Save-Data, a 2G/3G connection, ≤2 GB memory or ≤2 cores
- **high:** fine pointer, ≥6 cores and ≥4 GB memory
- **mid:** everything else

Override it with `?tier=low|mid|high`. The detected tier is exposed as `html[data-tier]` and `useDeviceTier()`.
