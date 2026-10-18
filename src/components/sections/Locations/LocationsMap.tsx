'use client'

import { useId, useRef, useState } from 'react'
import { NearImage } from '@/components/ui/NearImage'
import type { LocationsContent } from '@/content/sections/locations'
import { gsap, useGSAP } from '@/lib/gsap'
import { DURATION, EASE, SCRUB } from '@/lib/motion'
import { MAP_H, MAP_W, project, smoothPath, THAMES } from './geo'

const river = smoothPath(THAMES.map(project))
/** Strips in the photo's shutter reveal on each change of place. */
const SHUTTERS = 5

/**
 * Night map of central London: the Thames draws itself as you scroll, landmark pins pop in, and
 * choosing a place (list or pin) shows its card. The list is the accessible control; the map's
 * pins are mouse shortcuts and hidden from assistive tech.
 */
export function LocationsMap({ content }: { content: LocationsContent }) {
  const [active, setActive] = useState(0)
  // The outgoing place stays underneath while the new photo reveals over it.
  const [prev, setPrev] = useState<number | null>(null)
  const select = (i: number) => {
    if (i === active) return
    setPrev(active)
    setActive(i)
  }
  const root = useRef<HTMLDivElement>(null)
  const uid = useId()
  const loc = content.locations[active]
  const pins = content.locations.map((l) => project(l.latLon))
  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc.mapsQuery)}`

  useGSAP(
    () => {
      const q = gsap.utils.selector(root)
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const frame = q('[data-loc-frame]')[0]
        const photo = q('[data-loc-photo]')[0]
        // The photo wipes up into view first; then the map reveals, the river draws and pins drop in.
        gsap.fromTo(
          photo,
          { clipPath: 'inset(100% 0% 0% 0%)' },
          {
            clipPath: 'inset(0% 0% 0% 0%)',
            duration: DURATION.entrance,
            ease: EASE.entrance,
            scrollTrigger: { trigger: photo, start: 'top 80%', once: true },
          },
        )
        // Slow drift of the photo inside its frame while the section scrolls past.
        gsap.fromTo(
          q('[data-loc-stack]'),
          { yPercent: -4 },
          {
            yPercent: 4,
            ease: EASE.scrub,
            scrollTrigger: { trigger: photo, start: 'top bottom', end: 'bottom top', scrub: SCRUB },
          },
        )
        gsap.fromTo(
          frame,
          { clipPath: 'inset(0% 0% 100% 0%)' },
          {
            clipPath: 'inset(0% 0% 0% 0%)',
            duration: DURATION.entrance,
            ease: EASE.entrance,
            scrollTrigger: { trigger: frame, start: 'top 80%', once: true },
          },
        )
        gsap.fromTo(
          q('[data-loc-river]'),
          { strokeDashoffset: 1 },
          {
            strokeDashoffset: 0,
            ease: EASE.scrub,
            scrollTrigger: { trigger: frame, start: 'top 75%', end: 'center 55%', scrub: SCRUB },
          },
        )
        gsap.from(q('[data-loc-pin]'), {
          scale: 0,
          autoAlpha: 0,
          transformOrigin: '50% 50%',
          duration: DURATION.micro,
          ease: 'back.out(2)',
          stagger: 0.08,
          scrollTrigger: { trigger: frame, start: 'top 55%', once: true },
        })
      })
    },
    { scope: root },
  )

  // Each new place: its photo opens over the last one in shutters and settles from a slow push-in, while
  // the card's lines rise in turn. Tweens overwrite, so rapid picks never stack or stall.
  const firstShow = useRef(true)
  useGSAP(
    () => {
      if (firstShow.current) return void (firstShow.current = false)
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const q = gsap.utils.selector(root)
        // Shutters: the new photo opens in vertical strips, left to right, each dropping from the
        // top. One polygon clip on the single image (strips joined along the top edge with zero
        // area), so there is one <img> and one alt text throughout.
        const el = q('[data-loc-current]')[0] as HTMLElement | undefined
        if (el) {
          const strips = Array.from({ length: SHUTTERS }, () => ({ v: 0 }))
          const draw = () => {
            el.style.clipPath = `polygon(${strips
              .map(({ v }, i) => {
                const x0 = (i * 100) / SHUTTERS
                const x1 = ((i + 1) * 100) / SHUTTERS
                return `${x0}% 0%, ${x0}% ${v}%, ${x1}% ${v}%, ${x1}% 0%`
              })
              .join(', ')})`
          }
          draw()
          gsap
            .timeline({ onUpdate: draw, onComplete: () => void (el.style.clipPath = '') })
            .to(strips, { v: 100, duration: 0.85, ease: 'power3.inOut', stagger: 0.09 })
        }
        gsap.fromTo(
          q('[data-loc-current] > *'),
          { scale: 1.18 },
          { scale: 1, duration: DURATION.entrance * 1.6, ease: EASE.entrance, overwrite: true },
        )
        gsap.fromTo(
          q('[data-loc-prev] > *'),
          { scale: 1 },
          { scale: 1.06, duration: DURATION.entrance, ease: EASE.scene, overwrite: true },
        )
        gsap.fromTo(
          q('[data-loc-card] > *'),
          { autoAlpha: 0, y: 14 },
          {
            autoAlpha: 1,
            y: 0,
            duration: DURATION.micro,
            ease: EASE.entrance,
            stagger: 0.07,
            delay: 0.25,
            overwrite: true,
          },
        )
        gsap.fromTo(
          q('[data-loc-pin-active]'),
          { scale: 0.4 },
          {
            scale: 1,
            transformOrigin: '50% 50%',
            duration: DURATION.micro,
            ease: 'back.out(3)',
            overwrite: true,
          },
        )
      })
    },
    { scope: root, dependencies: [active] },
  )

  // The map now renders at about half its former width, so pins and labels are drawn larger in
  // map units to stay the same size on screen.
  return (
    <div ref={root} className="grid grid-cols-4 gap-x-(--grid-gutter) gap-y-6 md:grid-cols-12">
      <div
        data-loc-photo
        className="relative col-span-4 aspect-[4/3] overflow-hidden rounded-sm border border-hairline md:col-span-8"
      >
        <div data-loc-stack className="absolute inset-x-0 -inset-y-[5%]">
          {prev !== null && prev !== active ? (
            <div data-loc-prev aria-hidden className="absolute inset-0 overflow-hidden">
              <NearImage
                key={content.locations[prev].image.src}
                src={content.locations[prev].image.src}
                alt=""
                fill
                sizes="(min-width: 768px) 60vw, 92vw"
                className="object-cover"
              />
            </div>
          ) : null}
          <div data-loc-current key={loc.image.src} className="absolute inset-0 overflow-hidden">
            <NearImage
              src={loc.image.src}
              alt={loc.image.alt}
              fill
              sizes="(min-width: 768px) 60vw, 92vw"
              className="object-cover"
            />
          </div>
        </div>
      </div>

      <div className="col-span-4 flex flex-col gap-6 md:col-span-4">
        <div
          data-loc-frame
          className="relative overflow-hidden rounded-sm border border-hairline bg-ink/60"
        >
          <svg
            aria-hidden
            viewBox={`0 0 ${MAP_W} ${MAP_H}`}
            className="block h-auto w-full"
            role="presentation"
          >
            <defs>
              <linearGradient id={`${uid}-river`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#1c3550" />
                <stop offset="0.6" stopColor="#3e5c7a" />
                <stop offset="1" stopColor="#1c3550" />
              </linearGradient>
              <pattern id={`${uid}-grid`} width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M60 0H0V60" fill="none" stroke="rgb(232 226 214 / 0.06)" strokeWidth="2" />
              </pattern>
            </defs>
            <rect width={MAP_W} height={MAP_H} fill={`url(#${uid}-grid)`} />
            {/* River: soft glow, then the body, drawn by scroll via dashoffset. */}
            <path
              d={river}
              fill="none"
              stroke="#3e5c7a"
              strokeOpacity="0.25"
              strokeWidth="64"
              strokeLinecap="round"
            />
            <path
              data-loc-river
              d={river}
              fill="none"
              stroke={`url(#${uid}-river)`}
              strokeWidth="32"
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray={1}
            />
            <path id={`${uid}-label`} d={river} fill="none" stroke="none" />
            <text className="fill-stone/45 text-[24px] tracking-[0.3em] uppercase" dy="-32">
              <textPath href={`#${uid}-label`} startOffset="20%">
                {content.riverLabel}
              </textPath>
            </text>
            {pins.map(([x, y], i) => (
              <g
                key={content.locations[i].name}
                data-loc-pin
                transform={`translate(${x} ${y})`}
                className="cursor-pointer"
                onClick={() => select(i)}
              >
                <circle r="40" fill="transparent" />
                {/* Only the chosen place breathes; eight pulsing dots read as noise. */}
                {i === active ? <circle r="16" className="loc-pulse" /> : null}
                <circle
                  data-loc-pin-active={i === active || undefined}
                  r={i === active ? 14 : 10}
                  className={i === active ? 'fill-lamp' : 'fill-stone/80'}
                />
                {i === active ? (
                  <text
                    y="-30"
                    // Pins near the map edge anchor their label inward so it isn't clipped.
                    textAnchor={x < 160 ? 'start' : x > MAP_W - 160 ? 'end' : 'middle'}
                    x={x < 160 ? -14 : x > MAP_W - 160 ? 14 : 0}
                    className="fill-stone text-[30px] font-medium"
                  >
                    {content.locations[i].name}
                  </text>
                ) : null}
              </g>
            ))}
          </svg>
        </div>

        <ul aria-label={content.listLabel} className="loc-list">
          {content.locations.map((l, i) => (
            <li key={l.name}>
              <button
                type="button"
                aria-pressed={i === active}
                aria-controls={`${uid}-card`}
                onClick={() => select(i)}
                className="loc-chip"
              >
                {l.name}
              </button>
            </li>
          ))}
        </ul>

        <div id={`${uid}-card`} data-loc-card aria-live="polite">
          <p className="text-step--1 tracking-eyebrow text-lamp uppercase">{loc.area}</p>
          <h3 className="mt-2 font-display text-step-3 leading-snug text-stone">{loc.name}</h3>
          <p className="mt-3 text-step-0 leading-body text-stone-80">{loc.body}</p>
          <a
            className="link mt-4 inline-block text-step--1"
            href={mapsHref}
            target="_blank"
            rel="noopener noreferrer"
          >
            {content.openInMaps} <span aria-hidden>↗</span>
          </a>
        </div>
      </div>
    </div>
  )
}
