'use client'

import { useRef } from 'react'
import { gsap, SplitText, useGSAP } from '@/lib/gsap'
import { DURATION, EASE, STAGGER } from '@/lib/motion'

type SplitHeadingProps = {
  as?: 'h1' | 'h2' | 'h3'
  children: string
  id?: string
  className?: string
  trigger?: 'scroll' | 'load'
  delay?: number
}

/**
 * Heading whose lines rise out of a mask. SplitText keeps an aria-label with the full text,
 * re-splits on resize and font load, and is reverted with the GSAP context.
 */
export function SplitHeading({
  as: Tag = 'h2',
  children,
  id,
  className,
  trigger = 'scroll',
  delay = 0,
}: SplitHeadingProps) {
  const ref = useRef<HTMLHeadingElement>(null)

  useGSAP(
    () => {
      const el = ref.current
      if (!el) return
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.set(el, { autoAlpha: 1 })
        SplitText.create(el, {
          type: 'lines',
          mask: 'lines',
          autoSplit: true,
          onSplit: (self) =>
            gsap.from(self.lines, {
              yPercent: 110,
              duration: DURATION.entrance,
              ease: EASE.entrance,
              stagger: STAGGER.lines,
              delay,
              scrollTrigger:
                trigger === 'scroll' ? { trigger: el, start: 'top 85%', once: true } : undefined,
            }),
        })
      })
    },
    { scope: ref },
  )

  return (
    <Tag ref={ref} id={id} data-reveal className={className}>
      {children}
    </Tag>
  )
}
