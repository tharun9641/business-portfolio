'use client'

import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { useGSAP } from '@gsap/react'

// Registering is idempotent, so importing this module from many components is safe.
gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP)
// Entrances may target lazy images that haven't mounted yet; those tweens are harmless no-ops.
gsap.config({ nullTargetWarn: false })

export { gsap, ScrollTrigger, SplitText, useGSAP }
