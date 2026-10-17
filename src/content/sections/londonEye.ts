import type { ImageAsset } from '../types'

export type EyeSubsection = {
  heading: string
  body: string
  image: ImageAsset
}

export type LondonEyeContent = {
  eyebrow: string
  heading: string
  /** Accessible name for the subsection tab list. */
  tablistLabel: string
  /** "Go to Discovery" etc., for the dots and capsules. */
  goToLabel: string
  /** 4–8 subsections; each maps to one featured capsule. */
  subsections: EyeSubsection[]
  /** Back-to-front background layers (decorative). */
  layers: { src: string; depth: number; position?: string }[]
  mist: { src: string; top: string; height: string; opacity: number; duration: number }
  foreground: { src: string; depth: number }
  wheel: {
    capsules: number
    /** Desktop: hub x as a fraction of the wheel radius (0.2 → about 60% of the wheel visible). */
    hubX: number
    /** Wheel radius as a fraction of the viewport height (desktop) / width (mobile). */
    radius: { desktop: number; mobile: number }
  }
}

export const londonEyeContent: LondonEyeContent = {
  eyebrow: 'The Ride',
  heading: 'One slow revolution, five stops',
  tablistLabel: 'How we work, step by step',
  goToLabel: 'Go to',
  subsections: [
    {
      heading: 'Listen',
      body: 'We start at your kitchen table: how you live, what the light does in each room, what the building will allow.',
      image: {
        src: '/assets/eye/sub-01.avif',
        alt: 'An open sketchbook and a cup of coffee on an oak table by a sash window, London rooftops at dusk outside.',
        width: 1152,
        height: 1440,
      },
    },
    {
      heading: 'Imagine',
      body: 'Concept boards, models and honest numbers. Two or three directions, each one buildable.',
      image: {
        src: '/assets/eye/sub-02.avif',
        alt: 'A white card model of a townhouse extension under a brass desk lamp, blue-hour window behind.',
        width: 1152,
        height: 1440,
      },
    },
    {
      heading: 'Design',
      body: 'Every junction drawn, every finish sampled. Planning and building control handled for you.',
      image: {
        src: '/assets/eye/sub-03.avif',
        alt: 'Stone, brass and oak samples laid out on a drawing table at dusk.',
        width: 1152,
        height: 1440,
      },
    },
    {
      heading: 'Build',
      body: 'We run the site with trusted London trades and meet you there every week.',
      image: {
        src: '/assets/eye/sub-04.avif',
        alt: 'A warmly lit hallway with exposed brick and timber beams opening onto a garden at dusk.',
        width: 1152,
        height: 1440,
      },
    },
    {
      heading: 'Live',
      body: 'Handover, styling and a year of aftercare. Then the best part: switching the lamps on.',
      image: {
        src: '/assets/eye/sub-05.avif',
        alt: 'Placeholder: a living room with the lamps on and the Thames at blue hour.',
        width: 1152,
        height: 1440,
      },
    },
  ],
  layers: [
    { src: '/assets/eye/sky.avif', depth: 0.05 },
    { src: '/assets/eye/far-bank.webp', depth: 0.2 },
    { src: '/assets/eye/water.webp', depth: 0.45 },
  ],
  mist: {
    src: '/assets/shared/mist-2.webp',
    top: '68%',
    height: '16%',
    opacity: 0.35,
    duration: 95,
  },
  foreground: { src: '/assets/eye/foreground.webp', depth: 0.9 },
  wheel: { capsules: 32, hubX: 0.2, radius: { desktop: 0.46, mobile: 0.95 } },
}
