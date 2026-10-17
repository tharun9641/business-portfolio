import type { ImageAsset } from '../types'

/** Content shape for the _Template section. Copy this file alongside a copied section. */
export type TemplateContent = {
  eyebrow: string
  heading: string
  body: string
  image: ImageAsset
  /** Back-to-front scene layers. Decorative, so no alt text. */
  layers: {
    sky: string
    midground: string
    mist: string
    foreground: string
  }
  /** Optional reduced-motion still; without one, the layers render at rest. */
  staticFrame?: string
}

export const templateContent: TemplateContent = {
  eyebrow: 'The Studio',
  heading: 'Homes drawn for the hour the city glows',
  body: 'We design calm, light-filled rooms for London houses and flats: spaces that feel right at seven in the morning and better at dusk, when the lamps come on along the river.',
  image: {
    src: '/assets/shared/template/feature.png',
    alt: 'Placeholder: a warm-lit room with a view over London rooftops at dusk.',
    width: 1600,
    height: 2000,
  },
  layers: {
    sky: '/assets/shared/template/sky.avif',
    midground: '/assets/shared/template/midground.png',
    mist: '/assets/shared/mist-1.webp',
    foreground: '/assets/shared/template/foreground.png',
  },
}
