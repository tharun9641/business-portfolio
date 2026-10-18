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

## Current phase: 7 Additions (PM requests, 2026-10-18)

### Done

- Fixed the London Eye wheel not turning between subsections (D-46).
- Added the Locations section after the Eye (D-47).
- QA: 21/21 Playwright tests (including the Locations test and a rotation assertion), axe clean, 15/15 cross-browser.

## Phase 6 Ship (done)

- README written. Vercel project `london-portfolio` created with `vercel.json` (framework) and `.vercelignore`.
- Preview deploys verify correctly. **Production** (`london-portfolio.vercel.app`) still points at the first, broken build until the PM decides whether to promote a preview.

## Phase 5 (done)

- Contact band with server action, SEO (OG image, icons, robots, sitemap, LocalBusiness JSON-LD, canonical), axe 0 violations, contrast proof over imagery, Lighthouse desktop 100 / mobile 83–90, scroll trace, 15/15 cross-browser. See docs/PERFORMANCE.md.
- Open items needing a PM call: D-45 (simulated LCP; 3D setup long task).

## Notes

- polli CLI: `~/.npm-global/bin/polli` (logged in). Balance 0.01 pollen. Models: flux.1.1-pro (new images), flux.1-kontext-pro (edits).
- ML models cache in `.cache/models` (gitignored). Intermediates go in `assets-src/work/` (gitignored). Generated inputs are committed in `assets-src/generated/`.
- Dev server: `npx next dev -p 3000`.
