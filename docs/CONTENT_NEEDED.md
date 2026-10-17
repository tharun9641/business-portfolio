# Content needed

Every value in the brief's section 0 was still a placeholder. The build uses the dummy content below. All of it lives in `src/content/site.ts` and `src/content/sections/*.ts`, so replacing it never touches component code.

| Field            | Dummy value in use                                                                  | Needed from PM                                  |
| ---------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------- |
| BUSINESS_NAME    | Halden & Vale                                                                       | Real name                                       |
| WHAT_WE_DO       | "Architecture and interiors for London homes, designed at the hour the city glows." | Real one-sentence value proposition             |
| PRIMARY_CTA      | "Book a consultation"                                                               | Confirm wording                                 |
| CTA_DESTINATION  | `#contact` (on-page form → server action)                                           | Email / form provider / WhatsApp / Calendly URL |
| LOGO             | Text wordmark set in Cormorant Garamond (`shared/logo.svg`)                         | SVG logo if one exists                          |
| BRAND_COLORS     | London palette from brief §5                                                        | Brand hex values, if any                        |
| CONTACT_EMAIL    | hello@haldenvale.example                                                            | Real address                                    |
| PHONE / WHATSAPP | +44 20 0000 0000 (reserved-style dummy)                                             | Real number                                     |
| ADDRESS          | 1 Shad Thames, London SE1 2YG (illustrative, near Tower Bridge)                     | Real address for JSON-LD                        |
| SOCIAL_LINKS     | Instagram, LinkedIn, Pinterest → `#`                                                | Real URLs                                       |
| Hero photo       | Pexels #37544947 (PM-supplied), credited in the footer                              | Confirm the credit, or say to drop it           |
| Domain           | `https://example.com` (canonical, sitemap, OG)                                      | Production domain                               |

## London Eye subsections (5 dummies)

| #   | Heading | Body                                                                                                          | Image (to be generated)                                                                 |
| --- | ------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| 01  | Listen  | We start at your kitchen table: how you live, what the light does in each room, what the building will allow. | Sketchbook and coffee on an oak table by a sash window, London rooftops at dusk outside |
| 02  | Imagine | Concept boards, models and honest numbers. Two or three directions, each one buildable.                       | Architectural card model under a warm desk lamp, blue-hour window behind                |
| 03  | Design  | Every junction drawn, every finish sampled. Planning and building control handled for you.                    | Stone, brass and timber samples laid out on a drawing table at dusk                     |
| 04  | Build   | We run the site with trusted London trades and meet you there every week.                                     | Townhouse interior mid-renovation, work lights glowing, dusk through the open rear      |
| 05  | Live    | Handover, styling and a year of aftercare. Then the best part: switching the lamps on.                        | Finished living room with lamps lit, view of the Thames at blue hour                    |

Please confirm or replace: the number of subsections (4–8), the headings, the body copy and the image subjects.
