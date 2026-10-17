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
| 2 Assets            | **complete, waiting for PM approval**   | `phase-2-assets`     |
| 3 Tower Bridge hero | not started (needs approval of Phase 2) | —                    |

## Current phase: 2 Assets

### Done

- Hero layers built from the PM photo (`scripts/hero/build.mjs`): depth + BiRefNet + guided filter + push-pull fill, plus the route A blue-hour grade. The bascule pivots are in `src/content/generated/heroGeometry.json`.
- Opened-bridge check: `scripts/hero/preview-open.mjs`.
- Eye layers and subsection images (`scripts/eye/build.mjs`, with Swin2SR 2× via `scripts/lib/upscale.mjs`).
- Budget check plus the contact-sheet manifest (`scripts/check-asset-budgets.mjs`): every asset is within budget.
- `/dev/assets` contact sheet with a live hero layer stack (bascule-angle and separation sliders).
- Docs updated: ASSETS (Phase 2 status), DECISIONS D-20 and D-26–D-29, CONTENT_NEEDED, OPEN_QUESTIONS.

### Remaining

None. Waiting for PM approval. Known gaps: `eye/sub-05` and `eye/foreground` are placeholders until pollen is topped up.

## Notes

- polli CLI: `~/.npm-global/bin/polli` (logged in). Balance 0.01 pollen. Models: flux.1.1-pro (new images), flux.1-kontext-pro (edits).
- ML models cache in `.cache/models` (gitignored). Intermediates go in `assets-src/work/` (gitignored). Generated inputs are committed in `assets-src/generated/`.
- Dev server: `npx next dev -p 3000`.
