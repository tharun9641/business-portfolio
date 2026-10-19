'use client'

import { MotionConfig, motion } from 'motion/react'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { useSmoothScroll } from '@/components/motion/SmoothScrollProvider'
import { NearImage } from '@/components/ui/NearImage'
import type { LocationsContent } from '@/content/sections/locations'
import { gsap, ScrollTrigger, SplitText, useGSAP } from '@/lib/gsap'
import { DURATION, EASE, SCRUB, STAGGER } from '@/lib/motion'
import { progressForIndex } from '../LondonEye/wheelMath'

/** Seconds for one place-to-place change; the scroll eases to the new place in the same time. */
const STEP = 1.1
/** How far past the current place (in places) a scroll must go to move on: about 50px. */
const NUDGE = 0.06

/**
 * Full-screen landmark stage. The stage pins, and the slightest scroll plays a whole change to the
 * next (or previous) place as one timed animation: the next photo rises over the last while its
 * image drifts at a slower rate (parallax), and the outgoing photo sinks, zooms and dims. The place names run across the top with the current one
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
  const { reducedMotion, lenis } = useSmoothScroll()
  const loc = places[active]
  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc.mapsQuery)}`

  const current = useRef(0)
  const stepping = useRef(false)

  // Plays the whole change from the current place to `to` as one timed animation: forward, the
  // new photo rises over the last (its image drifting slower, the parallax) while the old one
  // sinks, zooms and dims; backward, the top photo drops away to uncover the earlier one.
  // Invariant: slides after the current one are clipped away; the current one is on top.
  const show = useCallback((to: number) => {
    const from = current.current
    if (to === from) return
    current.current = to
    setActive(to)
    setReach((r) => Math.max(r, to))
    const el = stage.current
    if (!el || !trigger.current) return
    const q = gsap.utils.selector(el)
    const slides = q('[data-loc-slide]')
    const imgs = q('[data-loc-img]')
    const shades = q('[data-loc-shade]')
    const t = { duration: STEP, ease: EASE.scene, overwrite: true }
    if (to > from) {
      gsap.fromTo(
        slides[to],
        { clipPath: 'inset(100% 0% 0% 0%)' },
        { clipPath: 'inset(0% 0% 0% 0%)', ...t },
      )
      gsap.fromTo(imgs[to], { yPercent: 14, scale: 1.12 }, { yPercent: 0, scale: 1, ...t })
      gsap.to(imgs[from], { yPercent: -8, scale: 1.08, ...t })
      gsap.to(shades[from], { opacity: 0.55, ...t })
    } else {
      for (let k = to + 1; k < from; k++) gsap.set(slides[k], { clipPath: 'inset(100% 0% 0% 0%)' })
      gsap.fromTo(
        slides[from],
        { clipPath: 'inset(0% 0% 0% 0%)' },
        { clipPath: 'inset(100% 0% 0% 0%)', ...t },
      )
      gsap.to(imgs[from], { yPercent: 14, scale: 1.12, ...t })
      gsap.to(imgs[to], { yPercent: 0, scale: 1, ...t })
      gsap.to(shades[to], { opacity: 0, ...t })
    }
  }, [])

  // One place per gesture: show it, then ease the scroll to its position, ignoring input meanwhile.
  const step = useCallback(
    (i: number) => {
      const st = trigger.current
      if (!st || !lenis) return show(i)
      stepping.current = true
      show(i)
      lenis.scrollTo(Math.round(st.start + progressForIndex(i, n) * (st.end - st.start)), {
        duration: STEP,
        lock: true,
        onComplete: () => void (stepping.current = false),
      })
    },
    [lenis, n, show],
  )
  const goTo = step

  // Pinned stage. Not scrubbed: the slightest scroll past the current place plays the next one.
  useGSAP(
    () => {
      const el = stage.current
      if (!el) return
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const q = gsap.utils.selector(el)
        // The first photo drifts into place as the stage scrolls up to pin.
        gsap.fromTo(
          q('[data-loc-img]')[0],
          { yPercent: -6 },
          {
            yPercent: 0,
            ease: EASE.scrub,
            scrollTrigger: { trigger: el, start: 'top bottom', end: 'top top', scrub: SCRUB },
          },
        )
        trigger.current = ScrollTrigger.create({
          trigger: el,
          start: 'top top',
          end: () => `+=${(n - 1) * window.innerHeight}`,
          pin: true,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (stepping.current) return
            const at = self.progress * (n - 1)
            const cur = current.current
            // Arrived from far away (a jump or the curtain): just match where we are.
            if (Math.abs(at - cur) > 1) show(Math.round(at))
            else if (at > cur + NUDGE) step(Math.min(n - 1, cur + 1))
            else if (at < cur - NUDGE) step(Math.max(0, cur - 1))
          },
        })
        ScrollTrigger.refresh()
        return () => {
          trigger.current = null
          stepping.current = false
        }
      })
    },
    // Rebuild from scratch when Lenis arrives, so no stale trigger keeps the old callbacks.
    { scope: stage, dependencies: [n, show, step], revertOnUpdate: true },
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
          <h3
            key={loc.name}
            data-loc-name
            className="font-display text-step-5 leading-tight tracking-display text-stone"
          >
            {loc.name}
          </h3>
          <p className="mt-2 text-step-0 text-lamp">{loc.area}</p>
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
