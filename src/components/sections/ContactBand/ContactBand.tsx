import { NearImage } from '@/components/ui/NearImage'
import { MaskReveal } from '@/components/motion/MaskReveal'
import { MistLayer } from '@/components/motion/MistLayer'
import { ParallaxLayer } from '@/components/motion/ParallaxLayer'
import { ParallaxScene } from '@/components/motion/ParallaxScene'
import { Reveal } from '@/components/motion/Reveal'
import { SplitHeading } from '@/components/motion/SplitHeading'
import type { ContactContent } from '@/content/sections/contact'
import { site } from '@/content/site'
import type { SectionProps } from '@/content/types'
import { ContactForm } from './ContactForm'

/** Contact / CTA band: the river at night behind an enquiry form. */
export function ContactBand({ id, content }: SectionProps<ContactContent>) {
  const headingId = `${id}-heading`
  const { email, phone } = site.contact
  return (
    <ParallaxScene id={id} labelledBy={headingId} className="flex min-h-svh items-center bg-ink">
      {content.layers.map((l) => (
        <ParallaxLayer key={l.src} depth={l.depth}>
          <NearImage src={l.src} alt="" fill sizes="100vw" className="object-cover object-bottom" />
        </ParallaxLayer>
      ))}
      <ParallaxLayer depth={0.7}>
        <MistLayer
          src="/assets/shared/mist-3.webp"
          top="64%"
          height="18%"
          opacity={0.4}
          duration={70}
        />
      </ParallaxLayer>
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-ink/70" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[25%] bg-linear-to-b from-ink to-transparent"
      />

      <div className="relative z-(--z-content) mx-auto grid w-full max-w-(--content-max) grid-cols-4 gap-x-(--grid-gutter) gap-y-12 px-(--page-margin) py-(--space-16) md:grid-cols-12">
        <div className="col-span-4 md:col-span-5">
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
            <p className="mt-6 max-w-[44ch] text-step-0 leading-body text-stone-80">
              {content.intro}
            </p>
          </Reveal>
          <MaskReveal
            className="mt-10 hidden max-w-md rounded-sm md:block"
            sizes="(min-width: 768px) 30vw, 0px"
            image={{ src: '/assets/hero/still.avif', alt: '', width: 4240, height: 2832 }}
          />
          <Reveal delay={0.2}>
            <p className="mt-8 text-step--1 text-stone-60">{content.direct.label}</p>
            <p className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-step-0">
              <a className="link" href={`mailto:${email}`}>
                {email}
              </a>
              <a className="link" href={`tel:${phone.replace(/\s/g, '')}`}>
                {phone}
              </a>
            </p>
          </Reveal>
        </div>
        <div className="col-span-4 md:col-span-6 md:col-start-7">
          <Reveal className="relative rounded-sm border border-hairline bg-ink/70 p-6 backdrop-blur-md md:p-10">
            <ContactForm content={content} />
          </Reveal>
        </div>
      </div>
    </ParallaxScene>
  )
}
