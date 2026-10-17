# Build progress (hand-off file)

Read this first when resuming. Update it at the end of every working session.

## Rules for resuming

- The brief's phase gates are binding: **never start a new phase without the PM's written approval in chat.** A resumed session only finishes the steps listed under "Current phase → Remaining" below.
- Work on the current phase branch. Commit only when the remaining steps are done and checks pass.
- End-of-phase checks: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `PHASE=<phase> npx playwright test` (screenshots go to `docs/qa/<phase>/`).

## Status

| Phase               | State                                   | Branch               |
| ------------------- | --------------------------------------- | -------------------- |
| 0 Recon             | approved                                | — (docs only)        |
| 1 Foundation        | approved, committed                     | `phase-1-foundation` |
| 2 Assets            | approved, committed                     | `phase-2-assets`     |
| 3 Tower Bridge hero | **in progress** (PM approved start)     | `phase-3-hero`       |

## Current phase: 3 Tower Bridge hero

### Done (uncommitted, unverified)
- `src/content/sections/hero.ts` (layers, exits, pin lengths, push, warning lights, bus, mist).
- `TowerBridgeHero.tsx` (server markup: layered stage, live reflection, lamp glows, shimmer streaks, warning lights, bus SVG, mist, reduced-motion still, h1 + value prop, scroll cue, fade overlay) and `HeroScene.tsx` (GSAP: fade up, bus crossing, pinned scrubbed opening; 200vh desktop / 140vh portrait).
- Hero CSS appended to `globals.css`; registered first in `registry.tsx` (id `top`); temporary sr-only h1 removed from `page.tsx`.

### Remaining
1. Run `npm run typecheck` and `npm run lint` and fix errors.
2. Open http://localhost:3000 (`npx next dev -p 3000`), and check the arrival fade, bus, opening, layer separation, camera push and fade-out at 1440 and 375. Tune the timings and exits in `hero.ts`.
3. Check reduced motion (still image, no pin) and the `?tier=low` view.
4. Add Playwright captures of hero scroll positions plus a recording. Update the QA spec "layers separate" test if section ids changed (the hero now comes first).
5. Update DECISIONS/MOTION docs, run all checks, `PHASE=phase-3 npx playwright test`, commit on `phase-3-hero`, then **stop for PM approval**.

## Notes

- polli CLI: `~/.npm-global/bin/polli` (logged in). Balance 0.01 pollen. Models: flux.1.1-pro (new images), flux.1-kontext-pro (edits).
- ML models cache in `.cache/models` (gitignored). Intermediates go in `assets-src/work/` (gitignored). Generated inputs are committed in `assets-src/generated/`.
- Dev server: `npx next dev -p 3000`.
