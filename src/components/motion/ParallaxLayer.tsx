import type { CSSProperties, ReactNode } from 'react'
import { PARALLAX_FACTOR, POINTER_MAX } from '@/lib/motion'

type ParallaxLayerProps = {
  /** 0 = static far background … 1 = foreground, fastest. */
  depth: number
  children: ReactNode
  className?: string
  /** Decorative layers are hidden from assistive tech. Set false for a layer that carries meaning. */
  decorative?: boolean
}

/**
 * One depth plane inside a <ParallaxScene>. The outer box takes the scroll translation and the
 * inner box the pointer offset, so the two never fight over the same transform.
 */
export function ParallaxLayer({
  depth,
  children,
  className,
  decorative = true,
}: ParallaxLayerProps) {
  // Overscan covers the farthest the layer travels (±depth × factor / 2 of the scene height).
  const overscan = `${(depth * PARALLAX_FACTOR * 50).toFixed(2)}%`
  const outer: CSSProperties = { top: `-${overscan}`, bottom: `-${overscan}` }
  const inner: CSSProperties = { left: -POINTER_MAX, right: -POINTER_MAX }

  return (
    <div
      data-layer
      data-depth={depth}
      aria-hidden={decorative || undefined}
      className="pointer-events-none absolute inset-x-0"
      style={outer}
    >
      <div data-layer-pointer className={`absolute inset-y-0 ${className ?? ''}`} style={inner}>
        {children}
      </div>
    </div>
  )
}
