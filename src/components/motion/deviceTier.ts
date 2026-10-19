export type DeviceTier = 'high' | 'mid' | 'low'

export type TierSignals = {
  cores?: number
  /** navigator.deviceMemory in GB (Chromium only). */
  memory?: number
  coarsePointer: boolean
  saveData?: boolean
  /** navigator.connection.effectiveType, e.g. '4g'. */
  connection?: string
  webgl: boolean
  /** WebGL renderer string, used to spot software rasterisers. */
  renderer?: string
}

const SOFTWARE_GPU = /swiftshader|llvmpipe|software|basic render/i

/** Pure classification, so it can be unit-tested and reused server-side. */
export function classifyTier(s: TierSignals): DeviceTier {
  if (!s.webgl || (s.renderer && SOFTWARE_GPU.test(s.renderer))) return 'low'
  // Only an explicit Data Saver or a genuinely 2G-class link. Chrome's estimate swings between
  // '3g' and '4g' on ordinary connections, which flipped the same machine to the flat wheel.
  if (s.saveData || (s.connection && /(^|-)2g$/.test(s.connection))) return 'low'
  if ((s.memory !== undefined && s.memory <= 2) || (s.cores !== undefined && s.cores <= 2)) {
    return 'low'
  }
  const strongCpu = (s.cores ?? 4) >= 6
  const enoughMemory = s.memory === undefined || s.memory >= 4
  return !s.coarsePointer && strongCpu && enoughMemory ? 'high' : 'mid'
}

export function isDeviceTier(value: unknown): value is DeviceTier {
  return value === 'high' || value === 'mid' || value === 'low'
}

/** Reads live browser signals. Client only. */
export function readTierSignals(): TierSignals {
  const nav = navigator as Navigator & {
    deviceMemory?: number
    connection?: { saveData?: boolean; effectiveType?: string }
  }
  let webgl = false
  let renderer: string | undefined
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl')
    if (gl) {
      webgl = true
      const info = gl.getExtension('WEBGL_debug_renderer_info')
      if (info) renderer = String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL))
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    }
  } catch {
    webgl = false
  }
  return {
    cores: nav.hardwareConcurrency,
    memory: nav.deviceMemory,
    coarsePointer: window.matchMedia('(pointer: coarse)').matches,
    saveData: nav.connection?.saveData,
    connection: nav.connection?.effectiveType,
    webgl,
    renderer,
  }
}
