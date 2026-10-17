'use client'

import { useRef, type ReactNode } from 'react'
import { useDeviceTier } from '@/components/motion/useDeviceTier'
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap'
import { EASE, SCRUB } from '@/lib/motion'

type HeroSceneProps = {
  id: string
  labelledBy: string
  children: ReactNode
  pin: { desktop: number; mobile: number }
  /** focus is a fraction of the stage (0..1). */
  push: { scale: number; focus: [number, number] }
  openAngle: number
  /** distance is a fraction of the stage width. */
  bus: { distance: number; durationS: number; delayS: number }
}

/**
 * Drives the hero: fade up from ink on load, one bus crossing, then a pinned, scrubbed opening:
 * warning lights, bascules lift, copy lifts away, layers separate, and the camera pushes through
 * the gap. Everything lives in one GSAP context scoped to this section.
 */
export function HeroScene({ id, labelledBy, children, pin, push, openAngle, bus }: HeroSceneProps) {
  const ref = useRef<HTMLElement>(null)
  const tier = useDeviceTier()

  useGSAP(
    () => {
      const section = ref.current
      if (!section) return
      const q = gsap.utils.selector(section)
      const mm = gsap.matchMedia()

      mm.add(
        {
          motion: '(prefers-reduced-motion: no-preference)',
          portrait: '(orientation: portrait)',
        },
        (ctx) => {
          const { motion, portrait } = ctx.conditions as { motion: boolean; portrait: boolean }
          if (!motion) return
          const stage = q('[data-hero-stage]')[0]

          // Arrival: the scene fades up out of --ink.
          gsap.fromTo(
            stage,
            { autoAlpha: 0, scale: 1.04 },
            { autoAlpha: 1, scale: 1, duration: 2.2, ease: EASE.entrance },
          )

          // One quiet bus crossing before the bridge opens (skipped on low-tier devices).
          const busEl = q('[data-hero-bus]')[0]
          const busTween =
            tier === 'low'
              ? null
              : gsap.fromTo(
                  busEl,
                  { x: 0, autoAlpha: 1 },
                  {
                    x: () => stage.offsetWidth * bus.distance,
                    duration: bus.durationS,
                    delay: bus.delayS,
                    ease: 'none',
                    onComplete: () => gsap.set(busEl, { autoAlpha: 0 }),
                  },
                )

          const [fx, fy] = push.focus
          gsap.set(stage, { transformOrigin: `${fx * 100}% ${fy * 100}%` })

          const tl = gsap.timeline({
            defaults: { ease: EASE.scrub },
            scrollTrigger: {
              trigger: section,
              start: 'top top',
              end: () => `+=${((portrait ? pin.mobile : pin.desktop) / 100) * window.innerHeight}`,
              pin: true,
              // The pin adds scroll height, so it must be measured before every later section.
              refreshPriority: 1,
              scrub: SCRUB,
              invalidateOnRefresh: true,
              onUpdate: (self) => {
                section.toggleAttribute('data-opening', self.progress > 0.01 && self.progress < 0.7)
                if (self.progress > 0 && busTween?.isActive()) {
                  busTween.kill()
                  gsap.to(busEl, { autoAlpha: 0, duration: 0.4 })
                }
              },
              onToggle: (self) =>
                gsap.set(q('[data-hero-layer], [data-hero-stage]'), {
                  willChange: self.isActive ? 'transform' : 'auto',
                }),
            },
          })

          tl.to(q('[data-hero-copy]'), { yPercent: -60, autoAlpha: 0, duration: 0.12 }, 0)
            .to(q('[data-hero-cue]'), { autoAlpha: 0, duration: 0.05 }, 0)
            .to(
              q('[data-bascule="left"]'),
              { rotation: -openAngle, duration: 0.5, ease: 'power1.inOut' },
              0.05,
            )
            .to(
              q('[data-bascule="right"]'),
              { rotation: openAngle, duration: 0.5, ease: 'power1.inOut' },
              0.05,
            )

          for (const layer of q('[data-hero-layer]')) {
            const ex = Number(layer.dataset.exitX)
            const ey = Number(layer.dataset.exitY)
            if (ex || ey)
              tl.to(layer, { xPercent: ex, yPercent: ey, duration: 0.6, ease: 'power1.in' }, 0.3)
          }

          tl.to(stage, { scale: push.scale, duration: 0.65, ease: 'power2.in' }, 0.35).to(
            q('[data-hero-fade]'),
            { autoAlpha: 1, duration: 0.15 },
            0.85,
          )

          // Later sections measured themselves before this pin existed; re-measure everything.
          ScrollTrigger.refresh()
        },
      )
    },
    { scope: ref, dependencies: [tier], revertOnUpdate: true },
  )

  return (
    <section
      ref={ref}
      id={id}
      aria-labelledby={labelledBy}
      data-hero
      className="relative isolate h-svh overflow-hidden bg-ink"
    >
      {children}
    </section>
  )
}
