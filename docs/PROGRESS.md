# Build progress (hand-off file)

Read this first when resuming. Update it at the end of every working session.

## Rules for resuming

- The brief's phase gates are binding: **never start a new phase without the PM's written approval in chat.** A resumed session only finishes the steps listed under "Current phase → Remaining" below.
- Work on the current phase branch. Commit only when the remaining steps are done and checks pass.
- End-of-phase checks: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `PHASE=<phase> npx playwright test` (screenshots go to `docs/qa/<phase>/`).

## Status

| Phase               | State                                 | Branch               |
| ------------------- | ------------------------------------- | -------------------- |
| 0 Recon             | approved                              | — (docs only)        |
| 1 Foundation        | approved, committed                   | `phase-1-foundation` |
| 2 Assets            | approved, committed                   | `phase-2-assets`     |
| 3 Tower Bridge hero | **complete, waiting for PM approval** | `phase-3-hero`       |

## Current phase: 3 Tower Bridge hero

### Done

- Hero content, markup and pinned GSAP sequence (see docs/MOTION.md → Tower Bridge hero).
- Tuned in the browser at 1440 and 375. Asset fixes: the far bank continues behind nearer layers, the low sky fades to night, and the pier posts are BiRefNet-masked.
- Reduced motion (still image, no pin, one h1) and `?tier=low` (no reflection or bus) verified.
- QA: 11/11 Playwright tests, including the hero sequence at both widths (bascules reach 80°). Evidence is in `docs/qa/phase-3/`.

### Remaining

None. Waiting for PM approval.

### Known polish items (for Phase 5)

- Late in the camera push, the river uncovered under the embankment shows a slightly flat, darker block.
- On desktop, the value proposition's second line grazes the tower spires (it stays readable).

## Notes

- polli CLI: `~/.npm-global/bin/polli` (logged in). Balance 0.01 pollen. Models: flux.1.1-pro (new images), flux.1-kontext-pro (edits).
- ML models cache in `.cache/models` (gitignored). Intermediates go in `assets-src/work/` (gitignored). Generated inputs are committed in `assets-src/generated/`.
- Dev server: `npx next dev -p 3000`.
