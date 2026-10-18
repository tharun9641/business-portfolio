'use client'

import 'lenis/dist/lenis.css'
import Lenis from 'lenis'
import { usePathname } from 'next/navigation'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { gsap, ScrollTrigger } from '@/lib/gsap'
import { classifyTier, isDeviceTier, readTierSignals, type DeviceTier } from './deviceTier'
import { useReducedMotion } from './useReducedMotion'

type ScrollTarget = string | number | HTMLElement

type SmoothScrollContextValue = {
  lenis: Lenis | null
  tier: DeviceTier
  reducedMotion: boolean
  /** Smooth-scrolls with Lenis, or jumps natively when smooth scroll is off. */
  scrollTo: (target: ScrollTarget, options?: { offset?: number; immediate?: boolean }) => void
}

const SmoothScrollContext = createContext<SmoothScrollContextValue | null>(null)

function detectTier(): DeviceTier {
  const override = new URLSearchParams(window.location.search).get('tier')
  return isDeviceTier(override) ? override : classifyTier(readTierSignals())
}

export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  const reducedMotion = useReducedMotion()
  const [lenis, setLenis] = useState<Lenis | null>(null)
  // 'mid' until mounted: the server can't know the device.
  const [tier, setTier] = useState<DeviceTier>('mid')
  const pathname = usePathname()

  useEffect(() => {
    const detected = detectTier()
    document.documentElement.dataset.tier = detected
    // eslint-disable-next-line react-hooks/set-state-in-effect -- device signals exist only after mount
    setTier(detected)
  }, [])

  // One Lenis instance, driven by GSAP's ticker so ScrollTrigger and Lenis share a frame.
  useEffect(() => {
    if (reducedMotion) return
    const instance = new Lenis({ autoRaf: false, anchors: true, lerp: 0.1 })
    instance.on('scroll', ScrollTrigger.update)
    const raf = (time: number) => instance.raf(time * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)
    // eslint-disable-next-line react-hooks/set-state-in-effect -- publishing the instance to context
    setLenis(instance)
    return () => {
      gsap.ticker.remove(raf)
      instance.destroy()
      setLenis(null)
    }
  }, [reducedMotion])

  // On route change: start at the top, then re-measure every trigger against the new layout.
  useEffect(() => {
    lenis?.scrollTo(0, { immediate: true, force: true })
    const id = requestAnimationFrame(() => ScrollTrigger.refresh())
    return () => cancelAnimationFrame(id)
  }, [pathname, lenis])

  const scrollTo = useCallback<SmoothScrollContextValue['scrollTo']>(
    (target, options = {}) => {
      if (lenis) {
        lenis.scrollTo(target, { offset: options.offset, immediate: options.immediate })
        return
      }
      const el = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target
      if (typeof el === 'number') window.scrollTo({ top: el })
      else el?.scrollIntoView({ block: 'start' })
    },
    [lenis],
  )

  const value = useMemo(
    () => ({ lenis, tier, reducedMotion, scrollTo }),
    [lenis, tier, reducedMotion, scrollTo],
  )

  return <SmoothScrollContext.Provider value={value}>{children}</SmoothScrollContext.Provider>
}

export function useSmoothScroll(): SmoothScrollContextValue {
  const ctx = useContext(SmoothScrollContext)
  if (!ctx) throw new Error('useSmoothScroll must be used inside <SmoothScrollProvider>')
  return ctx
}
