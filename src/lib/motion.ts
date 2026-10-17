/** Motion tokens. Keep in sync with src/styles/tokens.css and docs/MOTION.md. */
export const EASE = {
  entrance: 'power3.out',
  scene: 'expo.inOut',
  scrub: 'none',
} as const

export const DURATION = {
  micro: 0.6,
  entrance: 1.2,
} as const

/** ScrollTrigger scrub smoothing, in seconds. */
export const SCRUB = 1

/** Layer travel across a scene's full scroll range = depth × scene height × factor. */
export const PARALLAX_FACTOR = 0.25

/** Max pointer offset, in px, applied to a depth-1 layer. */
export const POINTER_MAX = 12

/** Stagger between split lines and words. */
export const STAGGER = { lines: 0.08, words: 0.03 } as const
