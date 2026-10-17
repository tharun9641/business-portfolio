'use client'

import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { useSmoothScroll } from '@/components/motion/SmoothScrollProvider'
import { site } from '@/content/site'
import { DURATION } from '@/lib/motion'
import { Button } from './Button'
import { Logo } from './Logo'

export type NavItem = { id: string; label: string }

const ease = [0.215, 0.61, 0.355, 1] as const

/** Fixed nav: logo, the always-visible CTA, and a full-screen menu built from the section registry. */
export function Nav({ items }: { items: NavItem[] }) {
  const [open, setOpen] = useState(false)
  const { lenis, scrollTo } = useSmoothScroll()
  const menuId = useId()
  const toggleRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const close = useCallback(() => {
    setOpen(false)
    toggleRef.current?.focus()
  }, [])

  // Freeze the page behind the menu.
  useEffect(() => {
    if (!open) return
    lenis?.stop()
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    return () => {
      lenis?.start()
      document.body.style.overflow = overflow
    }
  }, [open, lenis])

  // Escape closes; Tab stays inside the open menu.
  useEffect(() => {
    if (!open) return
    panelRef.current?.querySelector<HTMLElement>('a, button')?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return close()
      if (e.key !== 'Tab' || !panelRef.current) return
      // The toggle sits outside the panel but must stay reachable to close the menu.
      const focusable = [toggleRef.current, ...panelRef.current.querySelectorAll<HTMLElement>('a')]
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last?.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, close])

  const go = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()
    setOpen(false)
    lenis?.start()
    scrollTo(`#${id}`)
  }

  return (
    <header className="fixed inset-x-0 top-0 z-(--z-nav)">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -bottom-8 bg-linear-to-b from-ink/70 to-transparent"
      />
      <div className="relative mx-auto flex max-w-(--content-max) items-center justify-between gap-4 px-(--page-margin) py-4">
        <Logo />
        <div className="flex items-center gap-3">
          <Button href={site.cta.href} className="whitespace-nowrap max-sm:px-4">
            <span className="sm:hidden">{site.cta.shortLabel}</span>
            <span className="max-sm:hidden">{site.cta.label}</span>
          </Button>
          <button
            ref={toggleRef}
            type="button"
            aria-expanded={open}
            aria-controls={menuId}
            onClick={() => (open ? close() : setOpen(true))}
            className="relative z-(--z-menu) inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full border border-hairline px-4 text-step--1 text-stone transition-colors duration-(--dur-micro) hover:border-stone/60"
          >
            <span className="max-sm:sr-only">
              {open ? site.nav.closeLabel : site.nav.menuLabel}
            </span>
            <span aria-hidden className="relative block h-2.5 w-4">
              <motion.span
                className="absolute inset-x-0 top-0 h-px bg-current"
                animate={open ? { y: 5, rotate: 45 } : { y: 0, rotate: 0 }}
                transition={{ duration: DURATION.micro / 2, ease }}
              />
              <motion.span
                className="absolute inset-x-0 bottom-0 h-px bg-current"
                animate={open ? { y: -4, rotate: -45 } : { y: 0, rotate: 0 }}
                transition={{ duration: DURATION.micro / 2, ease }}
              />
            </span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            ref={panelRef}
            id={menuId}
            role="dialog"
            aria-modal="true"
            aria-label={site.nav.menuLabel}
            className="fixed inset-0 z-(--z-nav) flex flex-col justify-center bg-ink/95 px-(--page-margin) backdrop-blur-md"
            initial={{ clipPath: 'inset(0% 0% 100% 0%)' }}
            animate={{ clipPath: 'inset(0% 0% 0% 0%)' }}
            exit={{ clipPath: 'inset(0% 0% 100% 0%)' }}
            transition={{ duration: DURATION.micro, ease }}
          >
            <nav aria-label={site.nav.menuLabel} className="mx-auto w-full max-w-(--content-max)">
              <ul className="flex flex-col gap-2">
                {items.map((item, i) => (
                  <motion.li
                    key={item.id}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: DURATION.micro, ease, delay: 0.15 + i * 0.05 }}
                  >
                    <a
                      href={`#${item.id}`}
                      onClick={(e) => go(e, item.id)}
                      className="font-display text-step-5 leading-tight text-stone transition-colors duration-(--dur-micro) hover:text-lamp"
                    >
                      {item.label}
                    </a>
                  </motion.li>
                ))}
              </ul>
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  )
}
