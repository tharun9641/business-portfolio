import type { CSSProperties } from 'react'

type MistLayerProps = {
  /** Horizontally tileable mist band (see scripts/make-placeholders.mjs). */
  src: string
  /** Seconds for one full tile of drift. */
  duration?: number
  direction?: 'left' | 'right'
  opacity?: number
  /** Vertical placement of the band within its layer, e.g. '62%'. */
  top?: string
  height?: string
}

/**
 * Ambient mist drift: one composited element, twice the viewport wide, translated by exactly
 * one tile in a CSS loop. Stops under reduced motion (globals.css).
 */
export function MistLayer({
  src,
  duration = 90,
  direction = 'left',
  opacity = 0.7,
  top = '55%',
  height = '30%',
}: MistLayerProps) {
  const style = {
    top,
    height,
    opacity,
    backgroundImage: `url(${src})`,
    '--mist-duration': `${duration}s`,
    animationDirection: direction === 'left' ? 'normal' : 'reverse',
  } as CSSProperties

  return <div data-mist className="mist-drift absolute left-0 w-[200%]" style={style} />
}
