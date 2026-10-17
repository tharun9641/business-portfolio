# Adding a section

Three steps. No component outside the new folder changes.

## 1. Copy the template

```bash
cp -R src/components/sections/_Template src/components/sections/Stats
```

Rename `TemplateSection.tsx` → `StatsSection.tsx` and the exported function to `StatsSection`. The copy already includes:

- a `ParallaxScene` with 4 depth layers (sky 0.05, midground 0.3, mist 0.6, foreground 0.9)
- a scrim and edge fades
- a `SplitHeading`, `Reveal` body copy and a `MaskReveal` image
- the mist drift ambient loop

## 2. Add a content file

```bash
cp src/content/sections/template.ts src/content/sections/stats.ts
```

Rename the type and export (`StatsContent`, `statsContent`), then write the copy and image paths. Put the images in `public/assets/<section>/` and log them in `docs/ASSETS.md`. The section component imports its type from this file.

## 3. Register it

Add one line to `src/components/sections/registry.tsx` at the position it should appear:

```tsx
defineSection({ id: 'stats', navLabel: 'Numbers', component: StatsSection, content: statsContent }),
```

- `id` becomes the anchor (`#stats`) and the ScrollTrigger scope.
- `navLabel` adds the section to the menu. Leave it out to keep the section out of the menu.
- `defineSection` type-checks that the content matches the component.

(The registry is `.tsx` rather than `.ts` because it renders JSX.)

## Rules the template already follows

- No copy or image paths inside the component. Everything comes from `content`.
- The shell stays a server component. Only the motion primitives are client components.
- One `ParallaxScene` per section, which means one GSAP context. Triggers revert on unmount.
- Decorative layers use `alt=""` and are `aria-hidden`. Meaningful images carry real alt text.
- Reduced motion: layers render at rest, or pass `staticFrame` in the content to show a captured still instead.
