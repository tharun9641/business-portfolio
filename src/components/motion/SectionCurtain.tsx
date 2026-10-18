'use client'

import { useRef } from 'react'
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap'
import { isAutoScrolling, useSmoothScroll } from './SmoothScrollProvider'

/**
 * Section exits, each with its own character:
 * - `stick`: the outgoing section stays put (sinking back and dimming slightly) while the next one
 *   scrolls up over it and settles. Scroll-linked, so it reverses naturally.
 * - `line`: the outgoing section narrows to a white vertical line at the centre, the line turns
 *   horizontal, dips to the bottom and shoots up, bringing the next section up behind it. Timed:
 *   one scroll past the end plays it through (input held meanwhile); scrolling back up from the
 *   top of the next section plays it in reverse.
 * Off under reduced motion. The line never fires during menu/anchor scrolls or big jumps.
 */
export type SectionExit = { into: string; effect: 'stick' | 'line' }

export function SectionCurtain({ exits }: { exits: SectionExit[] }) {
  const line = useRef<HTMLDivElement>(null)
  const busy = useRef(false)
  const { lenis } = useSmoothScroll()

  useGSAP(
    () => {
      const bar = line.current
      if (!bar || !lenis) return
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const vh = () => window.innerHeight
        const start = (play: () => void) => {
          if (busy.current || isAutoScrolling()) return
          busy.current = true
          lenis.stop()
          play()
        }
        // Only when the reader has just scrolled into the next section; a big jump (End key,
        // find, restore) that lands past the boundary shouldn't drag them back.
        const justEntered = (next: HTMLElement) => next.getBoundingClientRect().top >= vh() * 0.4
        for (const { into, effect } of exits) {
          const next = document.getElementById(into)
          // The outgoing section (or the pin spacer wrapping it) sits just before the next one.
          const prev = next && (next.closest('.pin-spacer') ?? next).previousElementSibling
          if (!next || !(prev instanceof HTMLElement)) continue

          if (effect === 'stick') {
            // Looked up when scrolling, not now: the outgoing section may gain its pin spacer later,
            // and the spacer (not the pinned section, whose transform the pin owns) is what moves.
            const under = () => {
              const el = (next.closest('.pin-spacer') ?? next).previousElementSibling
              return el instanceof HTMLElement ? el : null
            }
            ScrollTrigger.create({
              trigger: next,
              start: 'top bottom',
              end: 'top top',
              onUpdate: ({ progress: t }) => {
                const el = under()
                if (!el) return
                // No transform at rest: it would trap a pin inside the section that is still
                // fixed at this boundary.
                if (t === 0)
                  return void gsap.set(el, { clearProps: 'transform,transformOrigin,opacity' })
                // Counter the scroll exactly, so it holds still under the next section, while it
                // sinks back and dims; shrinking about its visible part, the last screen.
                gsap.set(el, {
                  y: t * vh(),
                  scale: 1 - 0.06 * t,
                  opacity: 1 - 0.65 * t,
                  transformOrigin: `50% ${el.offsetHeight - vh() / 2}px`,
                })
              },
              onLeaveBack: () => {
                const el = under()
                if (el) gsap.set(el, { clearProps: 'transform,transformOrigin,opacity' })
              },
            })
            continue
          }

          // --- line ---
          const finish = () => {
            gsap.set(bar, { autoAlpha: 0 })
            gsap.set([prev, next], { clearProps: 'clipPath,transform' })
            busy.current = false
            lenis.start()
          }
          // Swap sections while only the line is on screen.
          const jump = (forward: boolean) => {
            const top = next.getBoundingClientRect().top + window.scrollY
            if (forward) {
              gsap.set(next, { clipPath: 'inset(100% 0px 0px 0px)' })
              lenis.scrollTo(top, { immediate: true, force: true })
            } else {
              gsap.set(prev, { clipPath: 'inset(0% 50% 0% 50%)' })
              gsap.set(next, { clearProps: 'clipPath,transform' })
              lenis.scrollTo(top - vh(), { immediate: true, force: true })
            }
            ScrollTrigger.update()
          }
          // The next section's top edge rides on the line as it rises (and falls, in reverse).
          const followLine = () =>
            gsap.set(next, {
              clipPath: `inset(${vh() / 2 + Number(gsap.getProperty(bar, 'y'))}px 0px 0px 0px)`,
            })
          const tl = gsap
            .timeline({ paused: true, onComplete: finish, onReverseComplete: finish })
            // 1. The page narrows to the centre; the white line takes over as the edges meet.
            .fromTo(
              prev,
              { clipPath: 'inset(0% 0% 0% 0%)' },
              {
                clipPath: 'inset(0% 50% 0% 50%)',
                duration: 0.6,
                ease: 'power3.in',
                immediateRender: false,
              },
            )
            .fromTo(bar, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.12 }, 0.48)
            .call(() => jump(!tl.reversed()))
            // 2. The line turns from vertical to horizontal, spanning the width.
            .fromTo(
              bar,
              { rotation: 0, scaleY: 1 },
              {
                rotation: 90,
                scaleY: () => window.innerWidth / vh(),
                duration: 0.45,
                ease: 'power2.inOut',
              },
            )
            // 3. It dips to the bottom edge...
            .fromTo(bar, { y: 0 }, { y: () => vh() / 2, duration: 0.35, ease: 'power2.in' })
            // 4. ...and shoots up to the top, bringing the next section up behind it.
            .to(bar, {
              y: () => -vh() / 2,
              duration: 0.55,
              ease: 'expo.out',
              onUpdate: followLine,
            })
            .fromTo(
              next,
              { yPercent: 8 },
              { yPercent: 0, duration: 0.55, ease: 'expo.out', immediateRender: false },
              '<',
            )
            .to(bar, { autoAlpha: 0, duration: 0.1 })

          ScrollTrigger.create({
            trigger: next,
            start: 'top 85%',
            onEnter: () => justEntered(next) && start(() => tl.play(0)),
          })
          ScrollTrigger.create({
            trigger: next,
            // 2px early: the forward jump lands exactly on the section top, which must count as
            // inside, or scrolling back up would never fire this.
            start: 'top 2px',
            onLeaveBack: () => {
              const top = next.getBoundingClientRect().top
              if (top <= 0 || top > vh() * 0.4) return
              start(() => tl.reverse(0))
            },
          })
        }
        return () => {
          busy.current = false
          lenis.start()
        }
      })
    },
    { dependencies: [lenis, exits], revertOnUpdate: true },
  )

  return (
    <>
      <div
        ref={line}
        aria-hidden
        className="pointer-events-none invisible fixed top-0 left-1/2 z-[70] h-svh w-0.5 -translate-x-1/2 bg-stone"
      />
    </>
  )
}
