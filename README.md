# Halden & Vale: London at blue hour

A cinematic, scroll-driven portfolio site. Tower Bridge opens to let the visitor in, then the London Eye carries them through the studio's process.

Built with Next.js 16 (App Router), TypeScript, Tailwind CSS 4, GSAP + ScrollTrigger + SplitText, Lenis and React Three Fiber.

> All business details are placeholders ("Halden & Vale"). See [`docs/CONTENT_NEEDED.md`](docs/CONTENT_NEEDED.md) for what to replace.

## Quick start

```bash
npm install
npm run dev            # http://localhost:3000
```

| Command                                             | What it does                                                               |
| --------------------------------------------------- | -------------------------------------------------------------------------- |
| `npm run dev`                                       | Dev server                                                                 |
| `npm run build` / `npm start`                       | Production build / serve                                                   |
| `npm run lint` · `npm run typecheck` · `npm test`   | ESLint (zero warnings), TypeScript, unit tests                             |
| `npx playwright test`                               | QA suite against a production build (screenshots go to `docs/qa/<PHASE>/`) |
| `npx playwright test -c playwright.cross.config.ts` | Chromium, WebKit and Firefox at 375/768/1280/1920                          |
| `node scripts/check-asset-budgets.mjs`              | Image weight budgets, plus the `/dev/assets` manifest                      |

## Editing content (no component changes needed)

All copy and image paths live in typed files under `src/content/`:

| File                                | What's in it                                                                   |
| ----------------------------------- | ------------------------------------------------------------------------------ |
| `src/content/site.ts`               | Business name, tagline, CTA, contact details, social links, footer, SEO basics |
| `src/content/sections/hero.ts`      | Hero copy, layer list, bascule angle, pin length, camera push, bus, mist       |
| `src/content/sections/londonEye.ts` | Eye heading and the **subsections** (4–8). Each one becomes a featured capsule |
| `src/content/sections/contact.ts`   | Contact band copy, form labels, validation and status messages                 |

TypeScript checks every content file. A missing or misspelt field fails `npm run typecheck`.

## Swapping images

1. Put the new file in `public/assets/<section>/`. Using the **same filename** makes it a drop-in replacement; otherwise update the path in the content file.
2. Keep the dimensions and transparency listed in [`docs/ASSETS.md`](docs/ASSETS.md). All hero layers share one 4240×2832 canvas.
3. Run `node scripts/check-asset-budgets.mjs` (hero ≤ 350 KB, others ≤ 250 KB, as served), then review everything at **`/dev/assets`**.

To rebuild the hero layers from a new photo, put it at `incoming-assets/hero/tower-bridge.jpg`, update the measurements in `scripts/hero/geometry.mjs`, and run `node scripts/hero/build.mjs`. The Eye plates rebuild with `node scripts/eye/build.mjs`.

## Adding a section (3 steps)

1. Copy `src/components/sections/_Template/` to a new folder.
2. Copy `src/content/sections/template.ts` and write the new content.
3. Add one line to `src/components/sections/registry.tsx`.

Full walkthrough: [`docs/SECTIONS.md`](docs/SECTIONS.md). The template already includes a parallax scene (4 layers), a SplitText heading, a masked image reveal and an ambient mist loop. Preview it at `/dev/template`.

## Contact form email

The form works out of the box in **log** mode (enquiries are summarised in the server log). To send real email through [Resend](https://resend.com), set these environment variables (in Vercel: Project → Settings → Environment Variables):

```
MAIL_PROVIDER=resend
RESEND_API_KEY=…
CONTACT_FROM="Halden & Vale <hello@your-domain>"   # a verified sender
CONTACT_TO=hello@your-domain                        # defaults to site.contact.email
```

## Deploying

Deploy to Vercel with zero config: `npx vercel` for a preview, `npx vercel --prod` for production. Set `site.url` in `src/content/site.ts` to the real domain, which is used for the canonical URL, sitemap, Open Graph and JSON-LD.

## Project docs

| Doc                                          | What it covers                                                     |
| -------------------------------------------- | ------------------------------------------------------------------ |
| [`docs/MOTION.md`](docs/MOTION.md)           | Motion tokens and how each sequence is choreographed               |
| [`docs/PERFORMANCE.md`](docs/PERFORMANCE.md) | Lighthouse, scroll trace, accessibility and cross-browser evidence |
| [`docs/DECISIONS.md`](docs/DECISIONS.md)     | Every judgement call made where the brief was silent               |
| [`docs/ASSETS.md`](docs/ASSETS.md)           | Asset manifest, pipeline and status                                |
| [`docs/PROGRESS.md`](docs/PROGRESS.md)       | Phase status and hand-off notes                                    |

## Credits

The hero photograph is by Michal Libertowski on [Pexels](https://www.pexels.com/photo/iconic-tower-bridge-overcast-view-in-london-37544947/) (Pexels licence), relit and layered for this site. The London Eye backdrop and interior images were generated with Pollinations (FLUX). The wheel is procedural.
