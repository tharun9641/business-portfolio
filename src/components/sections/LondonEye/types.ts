import type { RefObject } from 'react'

/** Pixel layout of the wheel inside the section (section coordinates, y down). */
export type WheelLayout = {
  width: number
  height: number
  hubX: number
  hubY: number
  /** Rim radius in px. */
  radius: number
  mobile: boolean
}

/** Imperative handle: the scroll timeline turns the wheel every frame without React renders. */
export type WheelHandle = { setRotation: (radians: number) => void }

/** Shared API of Wheel3D and Wheel2D. */
export type WheelProps = {
  layout: WheelLayout
  capsules: number
  featured: number[]
  initialRotation: number
  handleRef: RefObject<WheelHandle | null>
  onSelect: (index: number) => void
  /** Called once the wheel has drawn its first frame (3D swaps out the 2D stand-in). */
  onReady?: () => void
}

/** Capsule centre distance outside the rim, and capsule half-length, as fractions of the radius. */
export const CAPSULE = { offset: 0.075, halfLength: 0.06, halfHeight: 0.034 } as const
