'use client'

import { useSmoothScroll } from './SmoothScrollProvider'
import type { DeviceTier } from './deviceTier'

/** 'high' | 'mid' | 'low', detected once per visit. Override with `?tier=low` for testing. */
export function useDeviceTier(): DeviceTier {
  return useSmoothScroll().tier
}
