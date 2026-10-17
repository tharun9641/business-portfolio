/**
 * Pure maths for the London Eye: which capsules are featured, how far the wheel has turned for a
 * given scroll progress, and which subsection is active. Angles are radians, counter-clockwise
 * from 3 o'clock (standard maths orientation); the wheel turns by `rotation` about its hub.
 */

export const TAU = Math.PI * 2

/** Boarding point: 3 o'clock on desktop, 6 o'clock on mobile. */
export const BOARDING = { desktop: 0, mobile: -Math.PI / 2 } as const

/** N featured capsules spread evenly round the wheel, starting at capsule 0. */
export function featuredCapsules(n: number, total: number): number[] {
  return Array.from({ length: n }, (_, i) => Math.round((i * total) / n) % total)
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

/** Rotation for a scroll progress 0..1 across n subsections (linear between stops). */
export function rotationForProgress(
  p: number,
  featured: number[],
  total: number,
  boarding: number,
) {
  const n = featured.length
  if (n === 1) return rotationForIndex(0, featured, total, boarding)
  const t = Math.min(1, Math.max(0, p)) * (n - 1)
  const i = Math.min(n - 2, Math.floor(t))
  const a = rotationForIndex(i, featured, total, boarding)
  const b = rotationForIndex(i + 1, featured, total, boarding)
  return a + (b - a) * (t - i)
}

/** Subsection whose capsule is nearest the boarding point. */
export function activeIndex(p: number, n: number): number {
  return Math.min(n - 1, Math.max(0, Math.round(Math.min(1, Math.max(0, p)) * (n - 1))))
}

/** Scroll progress at which subsection i is exactly boarded. */
export function progressForIndex(i: number, n: number): number {
  return n <= 1 ? 0 : i / (n - 1)
}
