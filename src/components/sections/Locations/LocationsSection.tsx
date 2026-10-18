import { MistLayer } from '@/components/motion/MistLayer'
import { ParallaxLayer } from '@/components/motion/ParallaxLayer'
import { ParallaxScene } from '@/components/motion/ParallaxScene'
import { Reveal } from '@/components/motion/Reveal'
import { SplitHeading } from '@/components/motion/SplitHeading'
import { NearImage } from '@/components/ui/NearImage'
import type { LocationsContent } from '@/content/sections/locations'
import type { SectionProps } from '@/content/types'
import { LocationsStage } from './LocationsStage'

/** "Locations": an intro, then a full-screen stage of central London landmarks laid over one another on scroll. */
export function LocationsSection({ id, content }: SectionProps<LocationsContent>) {
  const headingId = `${id}-heading`
  return (
    <ParallaxScene id={id} labelledBy={headingId} className="bg-ink">
      <ParallaxLayer depth={0.05}>
        <NearImage src="/assets/eye/sky.avif" alt="" fill sizes="100vw" className="object-cover" />
      </ParallaxLayer>
      <ParallaxLayer depth={0.6}>
        <MistLayer
          src="/assets/shared/mist-2.webp"
          top="70%"
          height="16%"
          opacity={0.3}
          duration={100}
        />
      </ParallaxLayer>
      <ParallaxLayer depth={0.9}>
        <div className="loc-particles absolute inset-0" />
      </ParallaxLayer>
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-ink/75" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[20%] bg-linear-to-b from-ink to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[20%] bg-linear-to-t from-ink to-transparent"
      />

      <div className="relative z-(--z-content) mx-auto w-full max-w-(--content-max) px-(--page-margin) py-(--space-16)">
        <div className="max-w-[56ch]">
          <Reveal>
            <p className="text-step--1 tracking-eyebrow text-lamp uppercase">{content.eyebrow}</p>
          </Reveal>
          <SplitHeading
            id={headingId}
            className="mt-4 font-display text-step-5 leading-tight tracking-display text-balance text-stone"
          >
            {content.heading}
          </SplitHeading>
          <Reveal delay={0.15}>
            <p className="mt-6 text-step-0 leading-body text-stone-80">{content.intro}</p>
          </Reveal>
        </div>
      </div>
      <div className="relative z-(--z-content)">
        <LocationsStage content={content} />
      </div>
    </ParallaxScene>
  )
}
