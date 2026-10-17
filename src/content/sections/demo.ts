import type { TemplateContent } from './template'

/** Second _Template instance for the Phase 1 parallax demo; removed when real sections land. */
export const demoContent: TemplateContent = {
  eyebrow: 'Approach',
  heading: 'Every layer of a room, considered',
  body: 'Stone, timber, glass and light, balanced the way the city balances them at blue hour: deep colour, warm accents, and nothing that shouts.',
  image: {
    src: '/assets/shared/template/feature-2.png',
    alt: 'Placeholder: material samples on a drawing table under lamplight.',
    width: 1600,
    height: 2000,
  },
  layers: {
    sky: '/assets/shared/template/sky.avif',
    midground: '/assets/shared/template/midground.png',
    mist: '/assets/shared/mist-2.webp',
    foreground: '/assets/shared/template/foreground.png',
  },
}
