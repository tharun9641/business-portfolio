/**
 * Pure maths for the London Eye: which capsules are featured, how far the wheel has turned for a
 * given scroll progress, and which subsection is active. Angles are radians, counter-clockwise
 * from 3 o'clock (standard maths orientation); the wheel turns by `rotation` about its hub.
 */

export const TAU = Math.PI * 2

/** Boarding point: 3 o'clock on desktop, 6 o'clock on mobile. */
export const BOARDING = { desktop: 0, mobile: -Math.PI / 2 } as const

/**
 * The capsule boarded at each of N stops. With `cabinsPerStop` (e.g. 1), consecutive stops are that
 * many pods apart, so each stop turns the wheel by just that many cabins; without it, the N pods
 * are spread evenly round the wheel.
 */
export function featuredCapsules(n: number, total: number, cabinsPerStop?: number): number[] {
  return Array.from({ length: n }, (_, i) =>
    cabinsPerStop ? (i * cabinsPerStop) % total : Math.round((i * total) / n) % total,
  )
}

/** Resting angle of capsule `c` on an unrotated wheel. */
export function capsuleAngle(c: number, total: number): number {
  return (c / total) * TAU
}

/**
 * Wheel rotation that puts featured capsule `i` at the boarding point. Each step turns the wheel
 * clockwise (negative), so the ride always moves the same way.
 */
export function rotationForIndex(i: number, featured: number[], total: number, boarding: number) {
  return boarding - capsuleAngle(featured[i], total)
}

/**
 * Index of the capsule currently nearest the boarding point for a given wheel rotation. The light
 * lives at the boarding point, so it passes from pod to pod as the wheel turns.
 */
export function capsuleAt(rotation: number, boarding: number, total: number): number {
  const c = Math.round(((boarding - rotation) / TAU) * total)
  return ((c % total) + total) % total
}

/** Subsection whose capsule is nearest the boarding point. */
export function activeIndex(p: number, n: number): number {
  return Math.min(n - 1, Math.max(0, Math.round(Math.min(1, Math.max(0, p)) * (n - 1))))
}

/** Scroll progress at which subsection i is exactly boarded. */
export function progressForIndex(i: number, n: number): number {
  return n <= 1 ? 0 : i / (n - 1)
}
