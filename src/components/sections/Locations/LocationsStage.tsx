'use client'

import { MotionConfig, motion } from 'motion/react'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { useSmoothScroll } from '@/components/motion/SmoothScrollProvider'
import { NearImage } from '@/components/ui/NearImage'
import type { LocationsContent } from '@/content/sections/locations'
import { gsap, ScrollTrigger, SplitText, useGSAP } from '@/lib/gsap'
import { DURATION, EASE, SCRUB, STAGGER } from '@/lib/motion'
import { activeIndex, progressForIndex } from '../LondonEye/wheelMath'

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * Full-screen landmark stage. The stage pins and each viewport of scroll lays the next photo over
 * the last: it rises in from below while its image drifts at a slower rate (parallax), and the
 * outgoing photo sinks, zooms and dims. The place names run across the top with the current one
 * lit; the card on the photo follows. The names are the accessible control and jump the scroll.
 * Reduced motion: no pin; the names simply switch the photo.
 */
export function LocationsStage({ content }: { content: LocationsContent }) {
  const places = content.locations
  const n = places.length
  const [active, setActive] = useState(0)
  // Photos load one place ahead of the furthest reached, not all eight up front.
  const [reach, setReach] = useState(0)
  const stage = useRef<HTMLDivElement>(null)
  const bar = useRef<HTMLUListElement>(null)
  const trigger = useRef<ScrollTrigger | null>(null)
  const uid = useId()
  const { reducedMotion, scrollTo } = useSmoothScroll()
  const loc = places[active]
  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc.mapsQuery)}`

  const goTo = useCallback(
    (i: number) => {
      const st = trigger.current
      if (!st) {
        setActive(i)
        setReach((r) => Math.max(r, i))
        return
      }
      scrollTo(Math.round(st.start + progressForIndex(i, n) * (st.end - st.start)))
    },
    [n, scrollTo],
  )

  // Pinned, scrubbed overlay sequence.
  useGSAP(
    () => {
      const el = stage.current
      if (!el) return
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const q = gsap.utils.selector(el)
        const slides = q('[data-loc-slide]')
        const imgs = q('[data-loc-img]')
        const shades = q('[data-loc-shade]')
        // The first photo drifts into place as the stage scrolls up to pin.
        gsap.fromTo(
          imgs[0],
          { yPercent: -6 },
          {
            yPercent: 0,
            ease: EASE.scrub,
            scrollTrigger: { trigger: el, start: 'top bottom', end: 'top top', scrub: SCRUB },
          },
        )
        const tl = gsap.timeline({
          defaults: { ease: EASE.scrub, duration: 1 },
          scrollTrigger: {
            trigger: el,
            start: 'top top',
            end: () => `+=${(n - 1) * window.innerHeight}`,
            pin: true,
            scrub: SCRUB,
            invalidateOnRefresh: true,
            snap: {
              snapTo: 1 / (n - 1),
              inertia: false,
              duration: { min: 0.25, max: 0.7 },
              delay: 0.12,
              ease: 'power1.inOut',
            },
            onUpdate: (self) => {
              const i = activeIndex(self.progress, n)
              setActive(i)
              setReach((r) => Math.max(r, i))
            },
          },
        })
        trigger.current = tl.scrollTrigger ?? null
        for (let i = 1; i < n; i++) {
          const at = i - 1
          tl.fromTo(
            slides[i],
            { clipPath: 'inset(100% 0% 0% 0%)' },
            { clipPath: 'inset(0% 0% 0% 0%)' },
            at,
          )
            .fromTo(imgs[i], { yPercent: 14, scale: 1.12 }, { yPercent: 0, scale: 1 }, at)
            .to(imgs[i - 1], { yPercent: -8, scale: 1.08 }, at)
            .fromTo(shades[i - 1], { opacity: 0 }, { opacity: 0.55 }, at)
        }
        ScrollTrigger.refresh()
        return () => {
          trigger.current = null
        }
      })
    },
    { scope: stage, dependencies: [n] },
  )

  // Text handover on each new place: the name rises out of a mask, then the rest of the card.
  const firstShow = useRef(true)
  useGSAP(
    () => {
      if (firstShow.current) return void (firstShow.current = false)
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const q = gsap.utils.selector(stage)
        const name = q('[data-loc-name]')[0]
        if (name) {
          const split = SplitText.create(name, { type: 'lines', mask: 'lines' })
          gsap.from(split.lines, {
            yPercent: 110,
            duration: DURATION.entrance * 0.7,
            ease: EASE.entrance,
            stagger: STAGGER.lines,
            onComplete: () => split.revert(),
          })
        }
        gsap.fromTo(
          q('[data-loc-card] > :not([data-loc-name])'),
          { autoAlpha: 0, y: 14 },
          {
            autoAlpha: 1,
            y: 0,
            duration: DURATION.micro,
            ease: EASE.entrance,
            stagger: 0.06,
            delay: 0.1,
            overwrite: true,
          },
        )
      })
    },
    { scope: stage, dependencies: [active] },
  )

  // Keep the lit name in view when the bar scrolls sideways (phones).
  useEffect(() => {
    const list = bar.current
    const chip = list?.children[active] as HTMLElement | undefined
    if (!list || !chip || list.scrollWidth <= list.clientWidth) return
    list.scrollTo({
      left: chip.offsetLeft - list.clientWidth / 2 + chip.offsetWidth / 2,
      behavior: reducedMotion ? 'auto' : 'smooth',
    })
  }, [active, reducedMotion])

  return (
    <div ref={stage} className="relative h-svh w-full overflow-hidden bg-ink">
      {places.map((p, i) => {
        // Reduced motion shows only the chosen photo; otherwise all stack and scroll reveals them.
        if (reducedMotion && i !== active) return null
        return (
          <div
            key={p.name}
            data-loc-slide
            data-active={i === active || undefined}
            className="absolute inset-0 overflow-hidden"
            style={!reducedMotion && i > 0 ? { clipPath: 'inset(100% 0% 0% 0%)' } : undefined}
          >
            <div data-loc-img className="absolute inset-x-0 -inset-y-[8%] will-change-transform">
              {i <= reach + 1 ? (
                <NearImage
                  src={p.image.src}
                  alt={i === active ? p.image.alt : ''}
                  fill
                  sizes="100vw"
                  quality={60}
                  className="object-cover"
                  style={p.focus ? { objectPosition: p.focus } : undefined}
                />
              ) : null}
            </div>
            <div data-loc-shade aria-hidden className="absolute inset-0 bg-ink opacity-0" />
          </div>
        )
      })}

      {/* Scrims keep the names and card legible over any photo. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-linear-to-b from-ink/85 to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-linear-to-tr from-ink/90 via-ink/30 via-45% to-transparent to-75%"
      />

      <MotionConfig reducedMotion="user">
        <ul
          ref={bar}
          aria-label={content.listLabel}
          className="loc-bar absolute inset-x-0 top-20 z-(--z-content) flex gap-1 overflow-x-auto px-(--page-margin) md:justify-center"
        >
          {places.map((p, i) => (
            <li key={p.name} className="shrink-0">
              <button
                type="button"
                aria-pressed={i === active}
                aria-controls={`${uid}-card`}
                onClick={() => goTo(i)}
                className="loc-name"
              >
                {p.name}
                {i === active ? (
                  <motion.span
                    layoutId={`${uid}-lit`}
                    aria-hidden
                    className="absolute inset-x-3 bottom-1 h-px bg-lamp"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      </MotionConfig>

      <div className="absolute inset-x-0 bottom-0 z-(--z-content) mx-auto max-w-(--content-max) px-(--page-margin) pb-(--space-12)">
        <div id={`${uid}-card`} data-loc-card aria-live="polite" className="max-w-[46ch]">
          <p className="text-step--1 tracking-eyebrow text-lamp uppercase">
            <span className="tabular-nums">
              {pad(active + 1)} / {pad(n)}
            </span>
            <span aria-hidden className="mx-3 text-stone-60">
              ·
            </span>
            {loc.area}
          </p>
          <h3
            key={loc.name}
            data-loc-name
            className="mt-3 font-display text-step-5 leading-tight tracking-display text-stone"
          >
            {loc.name}
          </h3>
          <p className="mt-4 text-step-0 leading-body text-stone-80">{loc.body}</p>
          <a
            className="link mt-5 inline-block text-step--1"
            href={mapsHref}
            target="_blank"
            rel="noopener noreferrer"
          >
            {content.openInMaps} <span aria-hidden>↗</span>
          </a>
        </div>
      </div>
    </div>
  )
}
