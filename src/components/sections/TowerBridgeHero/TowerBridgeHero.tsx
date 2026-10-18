import Image from 'next/image'
import type { CSSProperties } from 'react'
import { MistLayer } from '@/components/motion/MistLayer'
import { SplitHeading } from '@/components/motion/SplitHeading'
import { Reveal } from '@/components/motion/Reveal'
import type { HeroContent, HeroLayer } from '@/content/sections/hero'
import type { SectionProps } from '@/content/types'
import { HeroScene } from './HeroScene'

/**
 * "The Opening": Tower Bridge at blue hour. Static markup lives here (server component); the pinned
 * scroll sequence is attached by <HeroScene>. Every layer shares one canvas, so positions below are
 * canvas px converted to % of the stage.
 */
export function TowerBridgeHero({ id, content }: SectionProps<HeroContent>) {
  const { canvas, bascules, lamps } = content.geometry
  const pct = (x: number, y: number) => ({
    left: `${(x / canvas.w) * 100}%`,
    top: `${(y / canvas.h) * 100}%`,
  })
  const origin = (layer: HeroLayer) => {
    if (!layer.bascule) return undefined
    const [px, py] = bascules[layer.bascule].pivot
    return `${(px / canvas.w) * 100}% ${(py / canvas.h) * 100}%`
  }
  const layerImage = (layer: HeroLayer, reflection = false) => (
    <Image
      src={layer.src}
      alt=""
      fill
      quality={60}
      preload={!reflection && layer.preload}
      loading={reflection ? 'lazy' : 'eager'}
      sizes="(orientation: portrait) 160vw, 150vw"
      className="object-cover"
    />
  )
  const bus = content.bus
  const busStyle: CSSProperties = {
    ...pct(bus.from, bus.deckY - bus.height),
    width: `${((bus.height * 2.4) / canvas.w) * 100}%`,
    height: `${(bus.height / canvas.h) * 100}%`,
  }
  const reflectStyle = { '--horizon': `${(content.horizonY / canvas.h) * 100}%` } as CSSProperties
  const headingId = `${id}-heading`

  return (
    <HeroScene
      id={id}
      labelledBy={headingId}
      pin={content.pin}
      push={{
        scale: content.push.scale,
        focus: [content.push.focus[0] / canvas.w, content.push.focus[1] / canvas.h],
      }}
      openAngle={content.openAngle}
      bus={{
        distance: (bus.to - bus.from) / canvas.w,
        durationS: bus.durationS,
        delayS: bus.delayS,
      }}
    >
      <div data-hero-frame className="hero-frame">
        <div data-hero-stage className="hero-stage">
          {content.layers.map((layer, i) => (
            <div
              key={layer.id}
              data-hero-layer={layer.id}
              data-depth={layer.depth}
              data-exit-x={layer.exit.x}
              data-exit-y={layer.exit.y}
              data-bascule={layer.bascule}
              className="absolute inset-0"
              style={{ transformOrigin: origin(layer), zIndex: i }}
            >
              {layerImage(layer)}
              {layer.id === 'embankment' ? (
                <>
                  {lamps.map(([x, y]) => (
                    <span key={`${x}-${y}`} aria-hidden className="hero-lamp" style={pct(x, y)} />
                  ))}
                  {/* Their reflections fall on the water just off the wall, and leave with it. */}
                  {lamps.slice(1).map(([x], i) => (
                    <span
                      key={`streak-${x}`}
                      aria-hidden
                      className="hero-streak"
                      style={{
                        ...pct(x - 150, content.horizonY + 20),
                        animationDelay: `${i * 0.43}s`,
                      }}
                    />
                  ))}
                </>
              ) : null}
            </div>
          ))}

          {/* Live river reflection of the bridge: a mirrored copy, so it opens with the bascules. */}
          <div
            data-hero-reflection
            aria-hidden
            className="hero-reflection"
            style={{ ...reflectStyle, zIndex: 5 }}
          >
            <div className="hero-reflection-flip">
              {content.layers
                .filter((l) => l.reflect)
                .map((layer) => (
                  <div
                    key={layer.id}
                    data-bascule={layer.bascule}
                    className="absolute inset-0"
                    style={{ transformOrigin: origin(layer) }}
                  >
                    {layerImage(layer, true)}
                  </div>
                ))}
            </div>
          </div>

          {/* Floodlit towers shimmering on the water. */}
          <div aria-hidden className="absolute inset-0" style={{ zIndex: 5 }}>
            {[1575, 2690].map((x, i) => (
              <span
                key={x}
                className="hero-streak"
                style={{
                  ...pct(x, content.horizonY + 20),
                  animationDelay: `${(i * 0.37) % 2}s`,
                }}
              />
            ))}
          </div>

          {content.warningLights.map(([x, y]) => (
            <span
              key={`${x}-${y}`}
              aria-hidden
              className="hero-warning"
              style={{ ...pct(x, y), zIndex: 4 }}
            />
          ))}

          <div data-hero-bus aria-hidden className="hero-bus" style={{ ...busStyle, zIndex: 4 }}>
            <svg viewBox="0 0 110 46" className="h-full w-full" fill="currentColor">
              <path d="M4 6a5 5 0 0 1 5-5h92a5 5 0 0 1 5 5v31H4z" />
              <path d="M10 6h90v9H10zM10 21h90v9H10z" fill="#e8b65a" fillOpacity="0.55" />
              <circle cx="22" cy="40" r="5.5" fill="#0b1220" />
              <circle cx="88" cy="40" r="5.5" fill="#0b1220" />
            </svg>
          </div>

          <div aria-hidden className="absolute inset-0" style={{ zIndex: 7 }}>
            {content.mist.map((m) => (
              <MistLayer key={m.src + m.top} {...m} />
            ))}
          </div>
        </div>
      </div>

      <div aria-hidden className="hero-curtain" />

      {/* Reduced motion: the composed still instead of the live stage. */}
      <div data-hero-still className="hero-still">
        <Image
          src="/assets/hero/still.avif"
          alt={content.stillAlt}
          fill
          sizes="100vw"
          className="object-cover"
        />
      </div>

      <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-ink/70 via-transparent to-transparent" />

      <div
        data-hero-copy
        className="absolute inset-x-0 top-[11svh] z-(--z-content) px-(--page-margin) text-center md:top-[8svh]"
      >
        <SplitHeading
          as="h1"
          id={headingId}
          trigger="load"
          delay={0.5}
          className="mx-auto max-w-[16ch] font-display text-step-6 leading-tight tracking-display text-balance text-stone"
        >
          {content.heading}
        </SplitHeading>
        <Reveal trigger="load" delay={1}>
          <p className="mx-auto mt-4 max-w-[46ch] text-step-0 leading-snug text-stone-80 md:text-step-1">
            {content.valueProp}
          </p>
        </Reveal>
      </div>

      <div data-hero-cue aria-hidden className="hero-cue">
        <span>{content.scrollCue}</span>
        <span className="hero-cue-line" />
      </div>

      <div
        data-hero-fade
        aria-hidden
        className="pointer-events-none absolute inset-0 z-(--z-content) bg-ink opacity-0"
      />
    </HeroScene>
  )
}
