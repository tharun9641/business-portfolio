import geometry from '../generated/heroGeometry.json'
import { site } from '../site'

/** One full-canvas layer of the Tower Bridge scene, back to front. */
export type HeroLayer = {
  id: string
  src: string
  /** 0 = far, 1 = near. Drives how far the layer travels as the scene separates. */
  depth: number
  /** Where the layer drifts as the camera pushes through, in % of the stage. */
  exit: { x: number; y: number }
  /** Bascules rotate about their pivot in `geometry.bascules`. */
  bascule?: 'left' | 'right'
  /** Mirrored into the river as a live reflection. */
  reflect?: boolean
}

export type HeroContent = {
  heading: string
  valueProp: string
  scrollCue: string
  stillAlt: string
  layers: HeroLayer[]
  geometry: typeof geometry
  /** Bascule lift at the end of the opening, in degrees. */
  openAngle: number
  /** Pin length as a % of the viewport height. */
  pin: { desktop: number; mobile: number }
  /** Camera push: final scale and the canvas point it pushes towards (between the towers). */
  push: { scale: number; focus: [number, number] }
  /** Horizon (water line) in canvas px, used for reflections and framing. */
  horizonY: number
  /** Red warning lights, canvas px. */
  warningLights: [number, number][]
  /** The double-decker that crosses once before the opening. */
  bus: {
    from: number
    to: number
    deckY: number
    height: number
    durationS: number
    delayS: number
  }
  mist: { src: string; top: string; height: string; opacity: number; duration: number }[]
}

export const heroContent: HeroContent = {
  heading: site.name,
  valueProp: site.tagline,
  scrollCue: 'Scroll to open',
  stillAlt: 'Tower Bridge at blue hour, floodlit in gold above the Thames, seen past HMS Belfast.',
  layers: [
    { id: 'sky', src: '/assets/hero/sky.avif', depth: 0.05, exit: { x: 0, y: 0 } },
    { id: 'skyline', src: '/assets/hero/skyline.webp', depth: 0.15, exit: { x: 0, y: 0 } },
    {
      id: 'towers',
      src: '/assets/hero/towers.webp',
      depth: 0.35,
      exit: { x: 0, y: 0 },
      reflect: true,
    },
    {
      id: 'bascule-left',
      src: '/assets/hero/bascule-left.webp',
      depth: 0.35,
      exit: { x: 0, y: 0 },
      bascule: 'left',
      reflect: true,
    },
    {
      id: 'bascule-right',
      src: '/assets/hero/bascule-right.webp',
      depth: 0.35,
      exit: { x: 0, y: 0 },
      bascule: 'right',
      reflect: true,
    },
    { id: 'water', src: '/assets/hero/water.webp', depth: 0.5, exit: { x: 0, y: 0 } },
    { id: 'belfast', src: '/assets/hero/belfast.webp', depth: 0.45, exit: { x: -14, y: 4 } },
    { id: 'piers', src: '/assets/hero/piers.webp', depth: 0.55, exit: { x: 0, y: 12 } },
    { id: 'embankment', src: '/assets/hero/embankment.webp', depth: 0.85, exit: { x: 22, y: 6 } },
  ],
  geometry,
  openAngle: 80,
  pin: { desktop: 200, mobile: 140 },
  push: { scale: 2.4, focus: [2151, 1380] },
  horizonY: 1700,
  warningLights: [
    [1712, 1596],
    [2590, 1596],
    [1690, 1210],
    [2612, 1210],
  ],
  bus: { from: 1640, to: 2700, deckY: 1606, height: 46, durationS: 7, delayS: 1.6 },
  mist: [
    { src: '/assets/shared/mist-1.webp', top: '54%', height: '9%', opacity: 0.35, duration: 110 },
    { src: '/assets/shared/mist-2.webp', top: '62%', height: '12%', opacity: 0.3, duration: 80 },
    { src: '/assets/shared/mist-3.webp', top: '74%', height: '14%', opacity: 0.22, duration: 60 },
  ],
}
