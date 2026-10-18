'use client'

import dynamic from 'next/dynamic'
import { NearImage } from '@/components/ui/NearImage'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { MistLayer } from '@/components/motion/MistLayer'
import { useSmoothScroll } from '@/components/motion/SmoothScrollProvider'
import { SplitHeading } from '@/components/motion/SplitHeading'
import type { LondonEyeContent } from '@/content/sections/londonEye'
import type { SectionProps } from '@/content/types'
import { gsap, ScrollTrigger, SplitText, useGSAP } from '@/lib/gsap'
import { DURATION, EASE, SCRUB } from '@/lib/motion'
import { CAPSULE, type WheelHandle, type WheelLayout } from './types'
import { Wheel2D } from './Wheel2D'
import {
  activeIndex,
  BOARDING,
  featuredCapsules,
  progressForIndex,
  rotationForIndex,
  rotationForProgress,
} from './wheelMath'

const loadWheel3D = () => import('./Wheel3D')
const Wheel3D = dynamic(loadWheel3D, { ssr: false })

const MOBILE_MAX = 767
const TABLET_MAX = 1023

function computeLayout(
  width: number,
  height: number,
  wheel: LondonEyeContent['wheel'],
): WheelLayout {
  // Phones, and tablets held upright, get the arc-on-top layout (matches the CSS media query).
  const mobile = width <= MOBILE_MAX || (width <= TABLET_MAX && height > width)
  if (mobile) {
    // Capped by height too, so tablets in portrait keep a proportionate arc.
    const radius = Math.min(wheel.radius.mobile * width, height * 0.55)
    // The active capsule (6 o'clock) sits at about 38% of the viewport height.
    const boardY = height * 0.38
    return {
      width,
      height,
      mobile,
      radius,
      hubX: width / 2,
      hubY: boardY - radius * (1 + CAPSULE.offset),
    }
  }
  const radius = wheel.radius.desktop * height
  return { width, height, mobile, radius, hubX: wheel.hubX * radius, hubY: height * 0.56 }
}

/**
 * "The Ride": the visitor boards each featured capsule in turn. Pinned for ~100vh per subsection;
 * scroll turns the wheel, snapping gently at each stop. The panel and progress dots form an
 * accessible tab pattern; every subsection's content stays in the DOM in order.
 */
export function LondonEyeSection({ id, content }: SectionProps<LondonEyeContent>) {
  const n = content.subsections.length
  const total = content.wheel.capsules
  const featured = featuredCapsules(n, total)
  const section = useRef<HTMLElement>(null)
  const wheelHandle = useRef<WheelHandle | null>(null)
  const trigger = useRef<ScrollTrigger | null>(null)
  const [layout, setLayout] = useState<WheelLayout | null>(null)
  const [active, setActive] = useState(0)
  const [use3D, setUse3D] = useState(false)
  const [ready3D, setReady3D] = useState(false)
  const [running, setRunning] = useState(false)
  const { tier, reducedMotion, scrollTo } = useSmoothScroll()
  const uid = useId()
  const headingId = `${id}-heading`
  const tabId = (i: number) => `${uid}-tab-${i}`
  const panelId = (i: number) => `${uid}-panel-${i}`
  const boarding = layout?.mobile ? BOARDING.mobile : BOARDING.desktop

  // Measure the section; the wheel is laid out in pixels.
  useEffect(() => {
    const el = section.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setLayout(computeLayout(width, Math.min(height, window.innerHeight), content.wheel))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [content.wheel])

  // Fetch and parse the 3D chunk once the visitor starts scrolling (during the hero), so mounting
  // it later only costs GPU setup and it never competes with the first load.
  useEffect(() => {
    if (!use3D) return
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 200))
    const onScroll = () => {
      window.removeEventListener('scroll', onScroll)
      idle(() => void loadWheel3D())
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [use3D])

  // 3D only where it will run well; the SVG wheel covers everything else.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- device tier is known only after mount
    setUse3D(tier !== 'low' && !reducedMotion)
  }, [tier, reducedMotion])

  const goTo = useCallback(
    (i: number) => {
      const st = trigger.current
      const next = Math.max(0, Math.min(n - 1, i))
      if (!st) return setActive(next)
      scrollTo(Math.round(st.start + progressForIndex(next, n) * (st.end - st.start)))
    },
    [n, scrollTo],
  )

  // Pinned scroll: rotation, active stop, background parallax.
  useGSAP(
    () => {
      const el = section.current
      if (!el || !layout) return
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const q = gsap.utils.selector(el)
        const tl = gsap.timeline({
          defaults: { ease: EASE.scrub },
          scrollTrigger: {
            trigger: el,
            start: 'top top',
            end: () => `+=${n * window.innerHeight}`,
            pin: true,
            scrub: SCRUB,
            invalidateOnRefresh: true,
            snap: {
              snapTo: 1 / (n - 1),
              // Settle on the nearest stop; velocity would overshoot to the first or last capsule.
              inertia: false,
              duration: { min: 0.25, max: 0.7 },
              delay: 0.12,
              ease: 'power1.inOut',
            },
            onUpdate: (self) => {
              wheelHandle.current?.setRotation(
                rotationForProgress(self.progress, featured, total, boarding),
              )
              setActive(activeIndex(self.progress, n))
            },
          },
        })
        trigger.current = tl.scrollTrigger ?? null
        for (const layer of q('[data-eye-layer]')) {
          const depth = Number(layer.dataset.depth)
          tl.fromTo(layer, { yPercent: 0 }, { yPercent: -depth * 12 }, 0)
        }
        ScrollTrigger.refresh()
        return () => {
          trigger.current = null
        }
      })
    },
    {
      scope: section,
      dependencies: [layout?.mobile, layout?.width, layout?.height, n],
      revertOnUpdate: true,
    },
  )

  // Mount the 3D chunk only once the section is within a screen of view (keeps it off the
  // critical path), and draw only while it is near the viewport.
  const [near, setNear] = useState(false)
  useEffect(() => {
    const el = section.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        setRunning(e.isIntersecting)
        if (e.isIntersecting) setNear(true)
      },
      { rootMargin: '100% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // Panel transition: the old stop exits up, the new one enters in sequence.
  const previous = useRef(0)
  const splits = useRef<SplitText[]>([])
  useGSAP(
    () => {
      const el = section.current
      if (!el) return
      const q = gsap.utils.selector(el)
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        splits.current = q('[data-eye-panel] h3').map((h) =>
          SplitText.create(h, { type: 'lines', mask: 'lines' }),
        )
        // Opacity only (not visibility): hidden stops stay readable by screen readers, in order.
        q('[data-eye-panel]').forEach((p, i) => gsap.set(p, { opacity: i === active ? 1 : 0 }))
        return () => splits.current.forEach((s) => s.revert())
      })
    },
    { scope: section, dependencies: [n] },
  )
  useGSAP(
    () => {
      const el = section.current
      const from = previous.current
      previous.current = active
      if (!el || from === active || reducedMotion) return
      const q = gsap.utils.selector(el)
      const panels = q('[data-eye-panel]')
      const next = panels[active]
      const prev = panels[from]
      const dir = active > from ? 1 : -1
      gsap.killTweensOf([prev, next, ...next.querySelectorAll('*')])
      gsap.to(prev, {
        yPercent: -8 * dir,
        opacity: 0,
        duration: DURATION.micro,
        ease: EASE.entrance,
      })
      gsap.set(next, { yPercent: 0, opacity: 1 })
      const lines = splits.current[active]?.lines ?? []
      gsap
        .timeline({ defaults: { ease: EASE.entrance } })
        .from(next.querySelector('[data-eye-number]'), {
          y: 16 * dir,
          autoAlpha: 0,
          duration: DURATION.micro,
        })
        .from(
          lines,
          { yPercent: 110 * dir, duration: DURATION.entrance * 0.8, stagger: 0.06 },
          0.08,
        )
        .from(
          next.querySelector('[data-eye-body]'),
          { y: 24 * dir, autoAlpha: 0, duration: DURATION.entrance * 0.8 },
          0.2,
        )
        .fromTo(
          next.querySelector('[data-eye-image]'),
          { clipPath: dir > 0 ? 'inset(100% 0% 0% 0%)' : 'inset(0% 0% 100% 0%)' },
          { clipPath: 'inset(0% 0% 0% 0%)', duration: DURATION.entrance },
          0.1,
        )
        .fromTo(
          next.querySelector('[data-eye-image] img'),
          { scale: 1.15 },
          { scale: 1, duration: DURATION.entrance * 1.3 },
          0.1,
        )
        .fromTo(
          q('[data-eye-connector] path'),
          { strokeDashoffset: 1 },
          { strokeDashoffset: 0, duration: DURATION.micro },
          0.05,
        )
    },
    { scope: section, dependencies: [active] },
  )

  // Tabs: arrow keys move between stops (roving tabindex).
  const onTabKey = (e: React.KeyboardEvent) => {
    const keys: Record<string, number> = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }
    let next = active
    if (e.key in keys) next = active + keys[e.key]
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = n - 1
    else return
    e.preventDefault()
    next = Math.max(0, Math.min(n - 1, next))
    goTo(next)
    document.getElementById(tabId(next))?.focus()
  }

  // Mobile: a horizontal swipe on the content advances or rewinds.
  const swipe = useRef<{ x: number; y: number } | null>(null)
  const onPointerDown = (e: React.PointerEvent) =>
    void (swipe.current = { x: e.clientX, y: e.clientY })
  const onPointerUp = (e: React.PointerEvent) => {
    const s = swipe.current
    swipe.current = null
    if (!s || !layout?.mobile) return
    const dx = e.clientX - s.x
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(e.clientY - s.y) * 1.5)
      goTo(active + (dx < 0 ? 1 : -1))
  }

  const initialRotation = rotationForIndex(0, featured, total, boarding)
  const wheelProps = layout && {
    layout,
    capsules: total,
    featured,
    active,
    initialRotation,
    handleRef: wheelHandle,
    onSelect: goTo,
  }
  // Connector: from the boarding capsule's outer edge to the panel.
  const connector =
    layout &&
    (layout.mobile
      ? {
          x1: layout.hubX,
          y1: layout.hubY + layout.radius * (1 + CAPSULE.offset + CAPSULE.halfHeight * 1.4),
          x2: layout.hubX,
          y2: layout.height * 0.45,
        }
      : {
          x1: layout.hubX + layout.radius * (1 + CAPSULE.offset + CAPSULE.halfLength * 1.3),
          y1: layout.hubY,
          x2: layout.width * 0.52,
          y2: layout.hubY,
        })

  return (
    <section ref={section} id={id} aria-labelledby={headingId} data-eye className="eye-section">
      {content.layers.map((l) => (
        <div key={l.src} data-eye-layer data-depth={l.depth} aria-hidden className="eye-layer">
          <NearImage src={l.src} alt="" fill sizes="100vw" className="object-cover object-bottom" />
        </div>
      ))}
      <div aria-hidden className="eye-layer" data-eye-layer data-depth={0.6}>
        <MistLayer {...content.mist} />
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-linear-to-r from-transparent via-ink/30 to-ink/80 max-md:bg-linear-to-b max-md:via-ink/50 max-md:to-ink/90"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[22%] bg-linear-to-b from-ink to-transparent"
      />
      {/* Bottom fade hands the river over to the next section without a seam. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[4] h-[16%] bg-linear-to-t from-ink to-transparent"
      />

      <div className="eye-wheel">
        {wheelProps ? (
          <>
            {!ready3D || !use3D || !near ? <Wheel2D {...wheelProps} /> : null}
            {use3D && near ? (
              <Wheel3D {...wheelProps} running={running} onReady={() => setReady3D(true)} />
            ) : null}
          </>
        ) : null}
      </div>

      <div
        data-eye-layer
        data-depth={content.foreground.depth}
        aria-hidden
        className="eye-foreground"
      >
        <NearImage
          src={content.foreground.src}
          alt=""
          fill
          sizes="40vw"
          className="object-contain object-bottom-left"
        />
      </div>

      {connector ? (
        <svg
          data-eye-connector
          aria-hidden
          className="eye-connector"
          width={layout?.width}
          height={layout?.height}
        >
          <path
            d={`M${connector.x1} ${connector.y1} L${connector.x2} ${connector.y2}`}
            pathLength={1}
            strokeDasharray={1}
            stroke="var(--lamp)"
            strokeWidth={1}
            fill="none"
          />
          <circle cx={connector.x2} cy={connector.y2} r={3} fill="var(--lamp)" />
        </svg>
      ) : null}

      <div className="eye-content" onPointerDown={onPointerDown} onPointerUp={onPointerUp}>
        <p className="text-step--1 tracking-eyebrow text-lamp uppercase">{content.eyebrow}</p>
        <SplitHeading
          id={headingId}
          className="mt-3 font-display text-step-4 leading-tight tracking-display text-balance text-stone"
        >
          {content.heading}
        </SplitHeading>

        <div className="eye-panels">
          {content.subsections.map((s, i) => (
            <div
              key={s.heading}
              id={panelId(i)}
              role="tabpanel"
              aria-labelledby={tabId(i)}
              data-eye-panel
              className="eye-panel"
              data-active={i === active || undefined}
            >
              <div className="eye-panel-text">
                <p data-eye-number className="font-mono text-step--1 text-lamp">
                  {String(i + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}
                </p>
                <h3 className="mt-3 font-display text-step-3 leading-snug text-stone">
                  {s.heading}
                </h3>
                <p
                  data-eye-body
                  className="mt-4 max-w-[38ch] text-step-0 leading-body text-stone-80"
                >
                  {s.body}
                </p>
              </div>
              <div data-eye-image className="eye-panel-image">
                <NearImage
                  src={s.image.src}
                  alt={s.image.alt}
                  fill
                  sizes="(max-width: 767px) 90vw, 22vw"
                  className="object-cover"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        role="tablist"
        aria-label={content.tablistLabel}
        aria-orientation={layout?.mobile ? 'horizontal' : 'vertical'}
        className="eye-dots"
        onKeyDown={onTabKey}
      >
        {content.subsections.map((s, i) => (
          <button
            key={s.heading}
            id={tabId(i)}
            type="button"
            role="tab"
            aria-selected={i === active}
            aria-controls={panelId(i)}
            aria-label={`${content.goToLabel} ${s.heading}`}
            tabIndex={i === active ? 0 : -1}
            onClick={() => goTo(i)}
            className="eye-dot"
          >
            <span aria-hidden />
          </button>
        ))}
      </div>
    </section>
  )
}
