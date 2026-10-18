'use client'

import Image, { type ImageProps } from 'next/image'
import { useEffect, useRef, useState } from 'react'

/**
 * A `fill` image that only requests its file once it is within a screen of the viewport.
 * Below-the-fold sections otherwise fall inside the browser's lazy-load distance before the
 * hero's pin adds its scroll height, and compete with the hero on first load.
 * Until then, a same-size placeholder keeps the layout and the alt text for assistive tech.
 */
export function NearImage(props: ImageProps & { fill: true }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [near, setNear] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || near) return
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), {
      rootMargin: '100% 0px',
    })
    io.observe(el)
    return () => io.disconnect()
  }, [near])

  if (near) return <Image {...props} alt={props.alt} />
  return (
    <span
      ref={ref}
      role={props.alt ? 'img' : undefined}
      aria-label={props.alt || undefined}
      aria-hidden={props.alt ? undefined : true}
      className="absolute inset-0 block bg-ink"
    />
  )
}
