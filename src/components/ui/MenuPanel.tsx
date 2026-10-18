'use client'

import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import { useEffect, type RefObject } from 'react'
import { DURATION } from '@/lib/motion'
import type { NavItem } from './Nav'

const ease = [0.215, 0.61, 0.355, 1] as const

type MenuPanelProps = {
  open: boolean
  id: string
  label: string
  items: NavItem[]
  panelRef: RefObject<HTMLDivElement | null>
  onGo: (e: React.MouseEvent<HTMLAnchorElement>, id: string) => void
}

/**
 * Full-screen menu, loaded on demand (it is the only user of Motion, which stays off the critical
 * path). Focus moves to the first entry whenever it opens.
 */
export default function MenuPanel({ open, id, label, items, panelRef, onGo }: MenuPanelProps) {
  useEffect(() => {
    if (open) panelRef.current?.querySelector<HTMLElement>('a')?.focus()
  }, [open, panelRef])

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence>
        {open ? (
          <motion.div
            ref={panelRef}
            id={id}
            role="dialog"
            aria-modal="true"
            aria-label={label}
            className="fixed inset-0 z-(--z-nav) flex flex-col justify-center bg-ink/95 px-(--page-margin) backdrop-blur-md"
            initial={{ clipPath: 'inset(0% 0% 100% 0%)' }}
            animate={{ clipPath: 'inset(0% 0% 0% 0%)' }}
            exit={{ clipPath: 'inset(0% 0% 100% 0%)' }}
            transition={{ duration: DURATION.micro, ease }}
          >
            <nav aria-label={label} className="mx-auto w-full max-w-(--content-max)">
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
                      onClick={(e) => onGo(e, item.id)}
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
    </MotionConfig>
  )
}
