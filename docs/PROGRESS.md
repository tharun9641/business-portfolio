# Build progress (hand-off file)

Read this first when resuming. Update it at the end of every working session.

## Rules for resuming

- **2026-10-18: the PM granted standing approval for all remaining phase gates in this build.**

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

## Current phase: 6 Ship

### Remaining

1. Write the README: editing content, swapping images, adding a section, scripts, env vars.
2. Deploy to Vercel. This needs the PM's Vercel login; set `MAIL_PROVIDER` and the related env vars.
3. Run the final checks against the deployed URL, then report.

## Phase 5 (done)

- Contact band with server action, SEO (OG image, icons, robots, sitemap, LocalBusiness JSON-LD, canonical), axe 0 violations, contrast proof over imagery, Lighthouse desktop 100 / mobile 83–90, scroll trace, 15/15 cross-browser. See docs/PERFORMANCE.md.
- Open items needing a PM call: D-45 (simulated LCP; 3D setup long task).

## Notes

- polli CLI: `~/.npm-global/bin/polli` (logged in). Balance 0.01 pollen. Models: flux.1.1-pro (new images), flux.1-kontext-pro (edits).
- ML models cache in `.cache/models` (gitignored). Intermediates go in `assets-src/work/` (gitignored). Generated inputs are committed in `assets-src/generated/`.
- Dev server: `npx next dev -p 3000`.
