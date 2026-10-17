'use client'

import { useRef, type ReactNode } from 'react'
import { gsap, useGSAP } from '@/lib/gsap'
import { EASE, PARALLAX_FACTOR, POINTER_MAX, SCRUB } from '@/lib/motion'
import { useDeviceTier } from './useDeviceTier'

type ParallaxSceneProps = {
  id: string
  children: ReactNode
  className?: string
  /** id of the heading that names this section. */
  labelledBy?: string
  /**
   * The scene's final composed frame, shown instead of the layers under reduced motion.
   * Omit it when the layers at rest already make a good still.
   */
  staticFrame?: ReactNode
}

/**
 * A full-bleed section that drives every <ParallaxLayer> inside it from one ScrollTrigger.
 * All triggers live in this component's GSAP context and are reverted on unmount.
 */
export function ParallaxScene({
  id,
  children,
  className,
  labelledBy,
  staticFrame,
}: ParallaxSceneProps) {
  const ref = useRef<HTMLElement>(null)
  const tier = useDeviceTier()

  useGSAP(
    () => {
      const scene = ref.current
      if (!scene) return
      const mm = gsap.matchMedia()

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const layers = gsap.utils.toArray<HTMLElement>('[data-layer]', scene)
        const tl = gsap.timeline({
          defaults: { ease: EASE.scrub },
          scrollTrigger: {
            trigger: scene,
            start: 'top bottom',
            end: 'bottom top',
            scrub: SCRUB,
            invalidateOnRefresh: true,
            onToggle: (self) =>
              gsap.set(layers, { willChange: self.isActive ? 'transform' : 'auto' }),
          },
        })

        for (const layer of layers) {
          const depth = Number(layer.dataset.depth)
          if (!depth) continue
          const travel = () => (depth * scene.offsetHeight * PARALLAX_FACTOR) / 2
          tl.fromTo(layer, { y: travel }, { y: () => -travel() }, 0)
        }

        if (tier !== 'high' || !window.matchMedia('(pointer: fine)').matches) return

        const movers = layers.map((layer) => {
          const inner = layer.querySelector<HTMLElement>('[data-layer-pointer]')
          const depth = Number(layer.dataset.depth)
          if (!inner || !depth) return null
          const opts = { duration: 0.8, ease: EASE.entrance }
          return { depth, x: gsap.quickTo(inner, 'x', opts), y: gsap.quickTo(inner, 'y', opts) }
        })

        const onMove = (e: PointerEvent) => {
          const nx = (e.clientX / window.innerWidth - 0.5) * 2
          const ny = (e.clientY / window.innerHeight - 0.5) * 2
          for (const m of movers) {
            if (!m) continue
            m.x(-nx * POINTER_MAX * m.depth)
            m.y(-ny * POINTER_MAX * m.depth)
          }
        }
        const onLeave = () => movers.forEach((m) => (m?.x(0), m?.y(0)))

        scene.addEventListener('pointermove', onMove)
        scene.addEventListener('pointerleave', onLeave)
        return () => {
          scene.removeEventListener('pointermove', onMove)
          scene.removeEventListener('pointerleave', onLeave)
        }
      })
    },
    { scope: ref, dependencies: [tier], revertOnUpdate: true },
  )

  return (
    <section
      ref={ref}
      id={id}
      aria-labelledby={labelledBy}
      data-scene
      data-has-static-frame={staticFrame ? '' : undefined}
      className={`relative isolate overflow-clip ${className ?? ''}`}
    >
      {children}
      {staticFrame ? (
        <div data-static-frame aria-hidden className="absolute inset-0 hidden">
          {staticFrame}
        </div>
      ) : null}
    </section>
  )
}
