import geometry from '@/content/generated/heroGeometry.json'
import manifest from './assetManifest.json'

/** Copy and data for the /dev/assets contact sheet (Phase 2 review). Not linked from the site. */

export type AssetRow = (typeof manifest)[number]

export type HeroLayer = {
  src: string
  label: string
  depth: number
  /** Bascules rotate about their pivot in the preview. */
  bascule?: 'left' | 'right'
}

export const contactSheet = {
  title: 'Asset contact sheet',
  intro:
    'Every image the site uses, with its size as next/image serves it (AVIF, 1x at 1920px). Approve the look here before animation starts in Phase 3.',
  comparisonsHeading: 'Tower Bridge hero: source, grade and reference',
  comparisons: [
    { src: '/dev/hero-original.jpg', label: 'Source photo (PM-supplied, Pexels #37544947)' },
    {
      src: '/assets/hero/still.avif',
      label: 'Graded composite: blue-hour grade on the full-res photo',
    },
    {
      src: '/dev/hero-reference.jpg',
      label: 'Kontext blue-hour pass, used only as the colour target',
    },
    { src: '/dev/hero-open.jpg', label: 'Bascules raised to 80° (fill behind the deck)' },
  ],
  stackHeading: 'Hero layer stack',
  stackIntro:
    'All layers share one 4240×2832 canvas, so they register exactly. Drag to raise the bascules about their measured pivots, or pull the layers apart by depth.',
  angleLabel: 'Bascule angle',
  separationLabel: 'Layer separation',
  heroLayers: [
    { src: '/assets/hero/sky.avif', label: 'Sky', depth: 0.05 },
    { src: '/assets/hero/skyline.webp', label: 'Skyline + far bank', depth: 0.15 },
    { src: '/assets/hero/towers.webp', label: 'Towers + walkways', depth: 0.35 },
    { src: '/assets/hero/bascule-left.webp', label: 'Left bascule', depth: 0.35, bascule: 'left' },
    {
      src: '/assets/hero/bascule-right.webp',
      label: 'Right bascule',
      depth: 0.35,
      bascule: 'right',
    },
    { src: '/assets/hero/water.webp', label: 'River', depth: 0.5 },
    { src: '/assets/hero/belfast.webp', label: 'HMS Belfast', depth: 0.45 },
    { src: '/assets/hero/piers.webp', label: 'Piers + gangways', depth: 0.55 },
    { src: '/assets/hero/embankment.webp', label: 'Embankment + lamps', depth: 0.85 },
  ] satisfies HeroLayer[],
  eyeHeading: 'London Eye: Westminster plate',
  eyeMaster: {
    src: '/dev/eye-master-1x.jpg',
    label: 'Generated master (flux.1.1-pro), before the 2× upscale',
  },
  gridHeading: 'All assets',
  placeholders: [
    '/assets/eye/sub-05.avif',
    '/assets/eye/foreground.webp',
    '/assets/shared/template/sky.avif',
    '/assets/shared/template/midground.png',
    '/assets/shared/template/foreground.png',
    '/assets/shared/template/feature.png',
    '/assets/shared/template/feature-2.png',
  ],
  labels: {
    placeholder: 'Placeholder',
    ready: 'Ready',
    over: 'Over budget',
    alpha: 'alpha',
  },
  geometry,
  assets: manifest,
}
