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

## Current phase: 4 London Eye

### Done

- Content (`londonEye.ts`), tested wheel maths, SVG wheel, procedural R3F wheel (rim tubes and struts, 64 cables, hub, A-frame, 32 level glass capsules, lamp-lit active capsule with halo).
- Pinned section: snapping stops, connector, panel transitions, roving-tabindex tablist, clickable capsules, mobile arc and swipe, low tier (SVG), reduced motion (list).
- QA: 16/16 Playwright tests (stops at 375/1440, keyboard and click, low tier, reduced motion). Evidence is in `docs/qa/phase-4/`.

### Remaining

None. Waiting for PM approval.

### Carried polish items (Phase 5)

- Hero: flat dark block revealed under the embankment late in the camera push; the value proposition grazes the spires on desktop.

## Notes

- polli CLI: `~/.npm-global/bin/polli` (logged in). Balance 0.01 pollen. Models: flux.1.1-pro (new images), flux.1-kontext-pro (edits).
- ML models cache in `.cache/models` (gitignored). Intermediates go in `assets-src/work/` (gitignored). Generated inputs are committed in `assets-src/generated/`.
- Dev server: `npx next dev -p 3000`.
