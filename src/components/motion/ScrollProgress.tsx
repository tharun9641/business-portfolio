'use client'

import { useRef } from 'react'
import { gsap, useGSAP } from '@/lib/gsap'

/**
 * Lamp-gold hairline across the top that fills with page progress. It maps scroll position
 * directly (no easing), so it stays on under reduced motion like a scrollbar would.
 */
export function ScrollProgress() {
  const bar = useRef<HTMLDivElement>(null)
  useGSAP(() => {
    gsap.fromTo(
      bar.current,
      { scaleX: 0 },
      {
        scaleX: 1,
        ease: 'none',
        scrollTrigger: { start: 0, end: 'max', scrub: true },
      },
    )
  })
  return (
    <div
      ref={bar}
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-px origin-left scale-x-0 bg-lamp/80"
    />
  )
}
