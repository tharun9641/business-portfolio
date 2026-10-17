import Image from 'next/image'
import { MaskReveal } from '@/components/motion/MaskReveal'
import { MistLayer } from '@/components/motion/MistLayer'
import { ParallaxLayer } from '@/components/motion/ParallaxLayer'
import { ParallaxScene } from '@/components/motion/ParallaxScene'
import { Reveal } from '@/components/motion/Reveal'
import { SplitHeading } from '@/components/motion/SplitHeading'
import type { TemplateContent } from '@/content/sections/template'
import type { SectionProps } from '@/content/types'

/**
 * Starter section: four depth layers (sky, midground, mist, foreground), a content layer with a
 * SplitText heading and a masked image reveal, and an ambient mist loop.
 * Copy this folder to add a section; see docs/SECTIONS.md.
 */
export function TemplateSection({ id, content }: SectionProps<TemplateContent>) {
  const headingId = `${id}-heading`

  return (
    <ParallaxScene
      id={id}
      labelledBy={headingId}
      className="flex min-h-[125svh] items-center bg-ink"
      staticFrame={
        content.staticFrame ? (
          <Image src={content.staticFrame} alt="" fill sizes="100vw" className="object-cover" />
        ) : undefined
      }
    >
      <ParallaxLayer depth={0.05}>
        <Image src={content.layers.sky} alt="" fill sizes="100vw" className="object-cover" />
      </ParallaxLayer>
      <ParallaxLayer depth={0.3}>
        <div className="absolute inset-x-0 bottom-[18%] h-[52%]">
          <Image
            src={content.layers.midground}
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-bottom"
          />
        </div>
        {/* Embankment and river below the skyline, so the sky's horizon glow never shows as ground. */}
        <div className="absolute inset-x-0 bottom-0 h-[18.5%] bg-linear-to-b from-[#0e1628] via-thames/60 to-ink" />
      </ParallaxLayer>
      <ParallaxLayer depth={0.6}>
        <MistLayer src={content.layers.mist} top="58%" height="28%" opacity={0.75} />
      </ParallaxLayer>
      <ParallaxLayer depth={0.9}>
        <div className="absolute bottom-[12%] left-0 h-[62%] w-[min(60vw,900px)]">
          <Image
            src={content.layers.foreground}
            alt=""
            fill
            sizes="60vw"
            className="object-contain object-bottom-left"
          />
        </div>
      </ParallaxLayer>

      {/* Scrim keeps copy at WCAG AA over any plate. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-linear-to-r from-ink/85 via-ink/45 to-ink/10"
      />
      {/* Edge fades blend each scene into --ink, so stacked scenes read as one continuous evening. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[18%] bg-linear-to-b from-ink to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[22%] bg-linear-to-t from-ink to-transparent"
      />

      <div className="relative z-(--z-content) mx-auto grid w-full max-w-(--content-max) grid-cols-4 gap-x-(--grid-gutter) gap-y-12 px-(--page-margin) py-(--space-16) md:grid-cols-12 md:items-center">
        <div className="col-span-4 md:col-span-6">
          <Reveal>
            <p className="mb-6 text-step--1 tracking-eyebrow text-lamp uppercase">
              {content.eyebrow}
            </p>
          </Reveal>
          <SplitHeading
            id={headingId}
            className="font-display text-step-5 leading-tight tracking-display text-balance text-stone"
          >
            {content.heading}
          </SplitHeading>
          <Reveal delay={0.2}>
            <p className="mt-8 max-w-[52ch] text-step-0 leading-body text-stone-80">
              {content.body}
            </p>
          </Reveal>
        </div>
        <div className="col-span-4 md:col-span-4 md:col-start-9">
          <MaskReveal image={content.image} sizes="(min-width: 768px) 30vw, 90vw" />
        </div>
      </div>
    </ParallaxScene>
  )
}
