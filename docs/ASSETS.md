# Asset manifest

Status key: `planned` → `generated` → `optimised` → `approved` (by PM) · `placeholder` = drop-in replacement needed.
Images come from PM-supplied photos first (`incoming-assets/`), then **Pollinations (`polli` CLI)** generation, per PM instruction (2026-10-18). Runway is not used.

## Style bible: shared prompt suffix

Every prompt ends with this suffix (`STYLE`) so all plates read as the same evening:

> photorealistic photograph, London at blue hour, deep Thames-blue sky fading to dusk, warm sodium-gold street lamps and lit windows, last low light coming from the left (west), light river mist and soft volumetric haze, wet stone reflections, 35mm lens, natural colour grade, subtle film grain, elegant and calm, no text, no logos, no signage, no people in focus, no HDR, no illustration

Negative constraints repeated in every prompt: _no TfL roundel, no Underground signage, no London Eye branding, no watermark, no text._

**Fixed camera for the hero set:** set by the PM photo (see the hero section). Every hero fill passes the photo as `--image` so framing and light stay locked.

## Pipeline

1. **Explore** compositions with `zimage` (free, fast). These are throwaway drafts and never ship.
2. **Masters:** `black-forest-labs/flux.1.1-pro` (PM choice; free tier), one photoreal master per scene. It has a maximum of **1440 px per side**, so a 2:1 master comes out at 1440×720.
   - **Upscale:** masters are then upscaled 4× offline with Swin2SR (Apache-2.0, via `@huggingface/transformers`) to reach the 3840-wide canvas. polli has no upscaler. See D-17.
3. **Derived plates:** reference edits of the master (`--image <master URL>`) with `black-forest-labs/flux.1-kontext-pro` (PM choice; free tier), e.g. "remove the bridge roadway, reveal the river and the far skyline behind it, change nothing else".
4. **Transparency:** polli has no background-removal endpoint. Three methods, in this order:
   - **Geometric masks** for the bascules: hand-authored polygons over the master, applied with `sharp`. Exact edges and exact pivots.
   - **Isolated props on a flat background:** the railing and lamp post are generated with flux.1.1-pro on a plain, evenly lit backdrop, then matted. Flux has no native transparency.
   - **Local matting** for organic cut-outs (skyline, towers, far bank). This is an offline Node script using `@huggingface/transformers` with the MIT-licensed BiRefNet ONNX model. It is a dev-only dependency and never shipped. See DECISIONS D-09.
5. **Optimise:** `scripts/optimise-assets.mjs` (sharp) resizes, trims alpha bounds and checks each file against its budget. Sources stay as lossless PNG in `assets-src/`. `next/image` serves AVIF/WebP. Brief filenames (`.png` / `.avif`) are kept as the public names.
6. **Size budgets** at 1x, served AVIF: hero layers ≤ 350 KB each, everything else ≤ 250 KB. The script fails if a file goes over.

## Hero: Tower Bridge ("The Opening")

**Source: PM-supplied photo** (image priority #1): `incoming-assets/hero/tower-bridge.jpg`.

- Pexels #37544947 by Michal Libertowski, downloaded 2026-10-18. 4240×2832 JPEG, 2.4 MB. Pexels licence: free use, no attribution required. Credit is offered in the footer anyway (D-19).
- **View:** eye level from the river path on the south side (Hay's Wharf / HMS Belfast), looking east. HMS Belfast is on the left; the bridge is closed and centred; the City and Canary Wharf towers sit behind; the riverside walk with globe lamps is on the right.
- **Light:** overcast daylight with a warm cast. It has to be **relit to blue hour** (D-20).

All hero layers are cut from this one photo, so geometry and perspective are exact. Generation (flux.1-kontext-pro) is used only to **fill what the photo hides**: the sky behind cut-out structures, the space behind the lifted bascules, and the water behind the piers.

### Measured geometry (source px, 4240×2832)

| Feature                        | x                                                     | y                             | Notes                                                                 |
| ------------------------------ | ----------------------------------------------------- | ----------------------------- | --------------------------------------------------------------------- |
| Left tower                     | 1450 – 1700                                           | 790 (spire) – 1610 (pier top) |                                                                       |
| Right tower                    | 2565 – 2795                                           | 760 – 1610                    |                                                                       |
| High-level walkways            | 1625 – 2570                                           | 1095 – 1190                   | Stay fixed                                                            |
| Bascule deck (closed)          | 1700 – 2565                                           | ≈1610 – 1690                  | Seam at x≈2132. The front edge is partly hidden by the pier gangways  |
| **Left bascule pivot**         | **≈1700**                                             | **≈1650**                     | Tower-side end. Refined to ±2 px in Phase 2, then stored in `hero.ts` |
| **Right bascule pivot**        | **≈2565**                                             | **≈1650**                     | Tower-side end                                                        |
| Lift clearance                 | —                                                     | 1190 → 1650 = 460 px          | Leaf length ≈432 px, so an 80° lift clears the walkways               |
| Globe lamps (lit at blue hour) | 3700/1090, 3420/1260, 3260/1400, 3210/1450, 3180/1490 |                               | Centres for the glow sprites                                          |

### Layers (back to front)

| #   | File                     | Alpha | Depth                            | Content                                                                                                                               | Method                                                     | Status  |
| --- | ------------------------ | ----- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | ------- |
| H1  | `hero/sky.avif`          | no    | 0.05                             | Sky only, relit to blue hour, extended upward by about 25% for parallax headroom and the portrait crop                                | Kontext fill (remove everything below the skyline) + grade | planned |
| H2  | `hero/skyline.png`       | yes   | 0.15                             | City and Canary Wharf towers plus the far bank, x 0–2600, y 1250–1700. Windows lit at blue hour                                       | matting + window-light pass                                | planned |
| H3  | `hero/towers.png`        | yes   | 0.35                             | Both towers, walkways, suspension chains and approach spans, **with the bascule deck removed** and the gap filled with far bank/river | Kontext fill of the deck strip → matting                   | planned |
| H4  | `hero/bascule-left.png`  | yes   | 0.35, rotates about (1700, 1650) | Deck strip x 1700–2132                                                                                                                | polygon mask                                               | planned |
| H5  | `hero/bascule-right.png` | yes   | 0.35, rotates about (2565, 1650) | Deck strip x 2132–2565                                                                                                                | polygon mask                                               | planned |
| H6  | `hero/belfast.png`       | yes   | 0.45                             | HMS Belfast and its moorings, x 0–1250                                                                                                | matting                                                    | planned |
| H7  | `hero/piers.png`         | yes   | 0.55                             | Pier gangways and pontoons in front of the deck, x 1250–3100, y 1580–2050. Keeps the bascule base naturally occluded                  | matting                                                    | planned |
| H8  | `hero/water.avif`        | no    | 0.5                              | River surface, y 1650–2832, regraded with long gold lamp reflections. Bridge reflection is live (D-06)                                | crop + Kontext fill behind the piers + grade               | planned |
| H9  | `hero/mist-*.webp`       | yes   | 0.6 – 0.8                        | Procedural mist (already generated: `shared/mist-1..3.webp`)                                                                          | procedural                                                 | done    |
| H10 | `hero/embankment.png`    | yes   | 0.85                             | Right-hand embankment, building, tree, globe lamps, x 2950–4240, full height. **Replaces the generated railing/lamp**                 | matting                                                    | planned |
| H11 | lamp glows               | —     | 0.85                             | Warm radial sprites at the lamp centres above, with a slow flicker loop                                                               | CSS                                                        | planned |
| H12 | warning lights           | —     | 0.35                             | Red lights on the towers, which blink before the lift                                                                                 | CSS                                                        | planned |
| H13 | bus silhouette           | —     | 0.35                             | Red double-decker crossing the deck once (y≈1610)                                                                                     | inline SVG                                                 | planned |

### Crops

- **Desktop (16:9):** source y 200–2585, the full width. Layers sit on a 4240×2385 canvas.
- **Mobile (9:16, ~140vh pin):** x 1330–2923, the full height. Both towers are framed; Belfast and the embankment mostly fall outside the crop, and their layers are shifted inwards via `hero.ts` transforms (D-05).
- **Resolution:** source 4240 wide, so no upscaling is needed for the hero. Swin2SR (D-17) is now only for Kontext-filled patches that come back below 1440 px.

## London Eye ("The Ride")

The wheel itself is procedural 3D, so **no plate may contain the London Eye**. The background is the Westminster side of the river (Palace of Westminster and the Elizabeth Tower across the water), seen from the South Bank close to where the wheel stands.

| #      | File                               | Px (source)     | Alpha | Depth          | Content / prompt (prefix + `STYLE`)                                                                                                                                                            | Method                 | Status                     |
| ------ | ---------------------------------- | --------------- | ----- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | -------------------------- |
| E0     | `assets-src/eye/master.png`        | 3840×2160       | no    | —              | "View across the Thames from the South Bank towards the Palace of Westminster and the Elizabeth Tower clock tower, Westminster Bridge on the far left, lamps lit, calm river, no ferris wheel" | gen master             | planned                    |
| E1     | `eye/sky.avif`                     | 3840×2160       | no    | 0.05           | Reuses the H1 sky, colour-shifted a little deeper (dusk 10 minutes later) so the sky carries straight on from the hero                                                                         | derived from H1        | planned                    |
| E2     | `eye/far-bank.png`                 | 3840×1100       | yes   | 0.2            | Westminster skyline cut from E0                                                                                                                                                                | matting                | planned                    |
| E3     | `eye/water.avif`                   | 3840×1200       | no    | 0.45           | River surface from E0 with the far bank removed. The capsules' live reflections are added on top in WebGL/CSS                                                                                  | edit of E0             | planned                    |
| E4     | `eye/mist-1.png`, `eye/mist-2.png` | 3840×600        | yes   | 0.6 / 0.75     | Procedural mist (same generator as H7, different seed)                                                                                                                                         | procedural             | planned                    |
| E5     | `eye/foreground.png`               | 2400×1600       | yes   | 0.9            | "South Bank embankment railing with bare plane-tree branches and a glowing lamp, close to the camera on the right"                                                                             | flux.1.1-pro + matting | planned                    |
| E6–E10 | `eye/sub-01.avif` … `sub-05.avif`  | 1600×2000 (4:5) | no    | inner parallax | One per subsection, matching the London-at-dusk interiors in `CONTENT_NEEDED.md`. Prompts are in `src/content/sections/londonEye.ts`                                                           | gen                    | planned (placeholder copy) |
| E11    | `eye/wheel-static.avif`            | 2000×2000       | yes   | —              | **Reduced-motion still**: an offline render of `Wheel3D` at subsection 1, captured with Playwright                                                                                             | render capture         | planned                    |

## Shared / other

| #   | File                                                                                    | Px                 | Notes                                                                              | Method                                                                                                                             | Status      |
| --- | --------------------------------------------------------------------------------------- | ------------------ | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| S1  | `shared/og.jpg`                                                                         | 1200×630           | Composited from the hero layers plus the business name                             | sharp composite                                                                                                                    | planned     |
| S2  | `shared/logo.svg`                                                                       | vector             | **Placeholder** wordmark set in the display serif                                  | SVG                                                                                                                                | placeholder |
| S3  | `shared/template/{sky.avif, midground.png, foreground.png, feature.png, feature-2.png}` | 3840×2160 etc.     | `_Template` demo scene                                                             | **procedural placeholders** from `scripts/make-placeholders.mjs` (gradient sky, SVG skyline, railing and lamp, abstract interiors) | placeholder |
| S6  | `shared/mist-1..3.webp`                                                                 | 1920×320, tileable | Mist bands for every scene (D-08)                                                  | procedural (`scripts/make-placeholders.mjs`)                                                                                       | done        |
| S4  | `hero/still.avif`, `eye/still.avif`                                                     | 1920×1080          | **Reduced-motion final frames**, captured from the composed scenes with Playwright | render capture                                                                                                                     | planned     |
| S5  | `public/favicon.svg`, `apple-icon.png`                                                  | —                  | From the logo                                                                      | SVG                                                                                                                                | placeholder |

## Cost estimate

Both models cost **0.03 pollen per image** (free tier, no Paid Pollen). The plan is about 25 final images plus about 2× that in retries, so roughly **75 generations ≈ 2.3 pollen**.

The current balance is **0.25 pollen** (about 8 images), so a top-up is needed before Phase 2. I'll confirm the real cost after the first generation (`polli usage --history`).
