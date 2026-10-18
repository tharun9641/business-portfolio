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
- **Motion** (the library): only in the full-screen menu panel (`MenuPanel`, loaded on demand, `MotionConfig reducedMotion="user"`). The CTA's lift and press and the menu icon are CSS transitions, so no animation library runs on the first load.
- **Hero arrival:** a CSS `--ink` curtain lifts off a fully painted scene, so LCP never waits for JavaScript.

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

## Tower Bridge hero (`TowerBridgeHero` + `HeroScene`)

All values come from `src/content/sections/hero.ts`.

| Scroll progress | What happens                                                                                                          |
| --------------- | --------------------------------------------------------------------------------------------------------------------- |
| on load         | Stage fades up from `--ink` (2.2 s); h1 lines rise (SplitText); value prop reveals; the bus crosses once              |
| 0 → 0.12        | Copy lifts (−60%) and fades; the scroll cue fades                                                                     |
| 0.01 → 0.7      | Warning lights blink                                                                                                  |
| 0.05 → 0.55     | Bascules rotate to ∓80° about their measured pivots (`power1.inOut`). The mirrored river reflection rotates with them |
| 0.30 → 0.90     | Layers drift apart along their `exit` vectors (Belfast left, embankment right, piers down)                            |
| 0.35 → 1.00     | Camera push: the stage scales to 2.4× about the gap between the towers (`power2.in`)                                  |
| 0.85 → 1.00     | Fade to `--ink`, handing over to the next section                                                                     |

- **Pin length:** 200vh on desktop, 140vh in portrait. Portrait uses its own stage framing (250vw wide), so both towers stay in view.
- **Low tier:** no reflection and no bus.
- **Reduced motion:** no pin. `hero/still.avif` is shown with the copy.

## London Eye (`LondonEyeSection`, `Wheel3D`, `Wheel2D`)

- **Pin:** N × 100vh, scrubbed, with gentle snapping to each stop (`snapTo: 1/(N−1)`, `inertia: false`).
- **Turning:** the wheel holds still while a stop is being read. When the active stop changes, it rides to the next capsule in one tween (1.5 s, `expo.inOut`) through `setRotation()` on whichever wheel is mounted. Capsules counter-rotate to stay level. Under reduced motion it jumps.
- **The light lives at the boarding point** (3 o'clock on desktop, 6 o'clock on mobile). Whichever pod is there is lit (`--lamp`, ×1.08, halo), so during a ride the light passes from pod to pod, as worked out by `capsuleAt()`.
- **One ride per stop change**, on a single timeline: the wheel turns by `cabinsPerStop` cabins (default 1, i.e. 1/32 of a turn) over about 2.2 s (`power2.inOut`), while the old stop scrolls up and fades. The new stop scrolls in from below between 40% and 100% of the turn and lands as its capsule arrives. The number, heading lines (SplitText) and body then appear (70–100%) and the connector draws, with the image clip-revealing alongside. If stops change rapidly, each new ride starts from wherever the last one had reached.
- **Background:** sky, far bank, water and mist drift by depth over the pin.
- **Ambient:** capsule lamps twinkle (shader colour, per capsule phase) and the halo pulses.
- **Mobile (≤767px):** the wheel arc sits at the top with boarding at 6 o'clock. Dots run in a row at the bottom, and a horizontal swipe on the content moves to the next or previous stop.
- **Tiers:**
  - `high`/`mid`: the R3F wheel is lazy-loaded (`next/dynamic`, `ssr:false`), with the SVG wheel shown until its first frame. The canvas only renders while the section is near the viewport.
  - `low`: SVG only.
- **Reduced motion:** no pin, a static SVG wheel, and every stop as a list.

## Locations (`LocationsSection`, `LocationsMap`)

- **Map reveal:** clip-path wipe-up once, at 80% of the viewport.
- **River draw:** the Thames path draws with stroke-dashoffset, scrubbed from `top 75%` to `center 55%`.
- **Pins:** pop in with `back.out` and a stagger once the map is mid-screen. Each pulses with a CSS ring loop, which stops under reduced motion.
- **Background:** sky, mist and light particles drift by depth via `ParallaxScene`.
