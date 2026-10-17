'use client'

import Image from 'next/image'
import { useRef } from 'react'
import type { ImageAsset } from '@/content/types'
import { gsap, useGSAP } from '@/lib/gsap'
import { DURATION, EASE, SCRUB } from '@/lib/motion'

type MaskRevealProps = {
  image: ImageAsset
  sizes: string
  className?: string
  /** Inner parallax travel as a % of the frame height. */
  innerTravel?: number
}

/**
 * Image that wipes up through a clip-path mask while settling from a slight zoom, then drifts
 * inside its frame as the page scrolls.
 */
export function MaskReveal({ image, sizes, className, innerTravel = 8 }: MaskRevealProps) {
  const frame = useRef<HTMLDivElement>(null)
  const inner = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap
          .timeline({ scrollTrigger: { trigger: frame.current, start: 'top 80%', once: true } })
          .set(frame.current, { autoAlpha: 1 })
          .fromTo(
            frame.current,
            { clipPath: 'inset(100% 0% 0% 0%)' },
            { clipPath: 'inset(0% 0% 0% 0%)', duration: DURATION.entrance, ease: EASE.entrance },
          )
          .fromTo(
            inner.current,
            { scale: 1.18 },
            { scale: 1, duration: DURATION.entrance * 1.4, ease: EASE.entrance },
            0,
          )

        gsap.fromTo(
          inner.current,
          { yPercent: -innerTravel / 2 },
          {
            yPercent: innerTravel / 2,
            ease: EASE.scrub,
            scrollTrigger: {
              trigger: frame.current,
              start: 'top bottom',
              end: 'bottom top',
              scrub: SCRUB,
            },
          },
        )
      })
    },
    { scope: frame },
  )

  return (
    <div
      ref={frame}
      data-reveal
      className={`relative overflow-hidden ${className ?? ''}`}
      style={{ aspectRatio: `${image.width} / ${image.height}` }}
    >
      {/* Taller than the frame so the inner drift never shows an edge. */}
      <div ref={inner} className="absolute inset-x-0 -inset-y-[6%]">
        <Image src={image.src} alt={image.alt} fill sizes={sizes} className="object-cover" />
      </div>
    </div>
  )
}
