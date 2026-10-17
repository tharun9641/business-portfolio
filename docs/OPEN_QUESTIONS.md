# Open questions (Phase 0)

Questions marked **blocking** must be answered before the phase named. Everything else has a default, shown in brackets, that I'll use if you don't say otherwise.

## Blocking

1. ~~Pollinations login~~ **Resolved:** logged in as `tharun9641`.
2. **Pollen top-up.** The models are decided (D-16). The balance is 0.25 pollen, about 8 images, and the asset plan needs about 2.3 pollen. Please top up about 3 pollen. _Blocks Phase 2._
3. ~~Project folder~~ **Resolved:** `~/Business-portfolio`.

## Content and business

4. Real business details: see `CONTENT_NEEDED.md`. [Default: the Halden & Vale dummy content.]
5. CTA destination and email provider for the contact form (Resend, Postmark, SMTP, or a Calendly/WhatsApp link only). [Default: on-page form with a log-only adapter, see D-14.]
6. Any files for `incoming-assets/` (logo, brand photography)? [Default: none, so everything is generated.]

## Design and motion

7. Fonts: are Cormorant Garamond + Hanken Grotesk OK? (D-02) [Default: yes.]
8. Bus silhouette: keep the optional crossing (§7.2)? [Default: yes, once, on first load only, skipped under reduced motion.]
9. Pointer parallax on desktop: on by default? [Default: on, ±12px nearest layer, `high` tier only.]
10. The Eye's 3 o'clock "boarding point" on desktop puts the active capsule at the right edge of the visible wheel. Should the gold connector line run horizontally to the panel's heading, or to the panel's top-left corner? [Default: to the left edge of the subsection number.]
11. Hero copy placement: should the business name sit **on** the closed roadway (it splits and lifts with the bascules) or **above** the bridge (it lifts and fades on its own)? [Default: above the walkways, so it never collides with the bascule edges.]

## Delivery

12. Vercel: your account or team, and the production domain? _Blocks Phase 6._
13. Git remote (GitHub repo URL), or local git only? [Default: local only until Phase 6.]
14. Analytics or a cookie banner? Neither is in the brief. [Default: none, which keeps Lighthouse Best Practices clean.]
