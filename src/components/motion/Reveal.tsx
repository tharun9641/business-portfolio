'use client'

import { useRef, type ReactNode } from 'react'
import { gsap, useGSAP } from '@/lib/gsap'
import { DURATION, EASE } from '@/lib/motion'

type RevealProps = {
  children: ReactNode
  className?: string
  delay?: number
  /** 'scroll' waits for the element to enter view; 'load' plays on mount (above the fold). */
  trigger?: 'scroll' | 'load'
  /** Vertical travel in px. */
  distance?: number
}

/** Standard entrance: fade and rise. Pre-hidden by CSS before hydration (see globals.css). */
export function Reveal({
  children,
  className,
  delay = 0,
  trigger = 'scroll',
  distance = 32,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo(
          ref.current,
          { autoAlpha: 0, y: distance },
          {
            autoAlpha: 1,
            y: 0,
            duration: DURATION.entrance,
            ease: EASE.entrance,
            delay,
            scrollTrigger:
              trigger === 'scroll'
                ? { trigger: ref.current, start: 'top 85%', once: true }
                : undefined,
          },
        )
      })
    },
    { scope: ref },
  )

  return (
    <div ref={ref} data-reveal className={className}>
      {children}
    </div>
  )
}
