'use client'

import { useId, useRef, useState } from 'react'
import type { LocationsContent } from '@/content/sections/locations'
import { gsap, useGSAP } from '@/lib/gsap'
import { DURATION, EASE, SCRUB } from '@/lib/motion'
import { MAP_H, MAP_W, project, smoothPath, THAMES } from './geo'

const river = smoothPath(THAMES.map(project))

/**
 * Night map of central London: the Thames draws itself as you scroll, landmark pins pop in, and
 * choosing a place (list or pin) shows its card. The list is the accessible control; the map's
 * pins are mouse shortcuts and hidden from assistive tech.
 */
export function LocationsMap({ content }: { content: LocationsContent }) {
  const [active, setActive] = useState(0)
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
        // Masked reveal of the map, then the river draws with the scroll and the pins drop in.
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

  return (
    <div ref={root} className="grid grid-cols-4 gap-x-(--grid-gutter) gap-y-8 md:grid-cols-12">
      <div
        data-loc-frame
        className="relative col-span-4 overflow-hidden rounded-sm border border-hairline bg-ink/60 md:col-span-8"
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
            <pattern id={`${uid}-grid`} width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M40 0H0V40" fill="none" stroke="rgb(232 226 214 / 0.05)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width={MAP_W} height={MAP_H} fill={`url(#${uid}-grid)`} />
          {/* River: soft glow, body, then a fine highlight. Drawn by scroll via dashoffset. */}
          <path
            d={river}
            fill="none"
            stroke="#3e5c7a"
            strokeOpacity="0.25"
            strokeWidth="44"
            strokeLinecap="round"
          />
          <path
            data-loc-river
            d={river}
            fill="none"
            stroke={`url(#${uid}-river)`}
            strokeWidth="22"
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray={1}
          />
          <path id={`${uid}-label`} d={river} fill="none" stroke="none" />
          <text className="fill-stone/45 text-[13px] tracking-[0.3em] uppercase" dy="-20">
            <textPath href={`#${uid}-label`} startOffset="22%">
              {content.riverLabel}
            </textPath>
          </text>
          {pins.map(([x, y], i) => (
            <g
              key={content.locations[i].name}
              data-loc-pin
              transform={`translate(${x} ${y})`}
              className="cursor-pointer"
              onClick={() => setActive(i)}
            >
              <circle r="22" fill="transparent" />
              <circle
                r="9"
                className="loc-pulse"
                style={{ animationDelay: `${(i * 0.31) % 2.4}s` }}
              />
              <circle
                r={i === active ? 8 : 5.5}
                className={i === active ? 'fill-lamp' : 'fill-stone/80'}
              />
              {i === active ? (
                <text y="-18" textAnchor="middle" className="fill-stone text-[15px] font-medium">
                  {content.locations[i].name}
                </text>
              ) : null}
            </g>
          ))}
        </svg>
      </div>

      <div className="col-span-4 flex flex-col gap-6 md:col-span-4">
        <ul aria-label={content.listLabel} className="loc-list">
          {content.locations.map((l, i) => (
            <li key={l.name}>
              <button
                type="button"
                aria-pressed={i === active}
                aria-controls={`${uid}-card`}
                onClick={() => setActive(i)}
                className="loc-chip"
              >
                {l.name}
              </button>
            </li>
          ))}
        </ul>
        <div
          id={`${uid}-card`}
          aria-live="polite"
          className="rounded-sm border border-hairline bg-ink/70 p-6 backdrop-blur-md"
        >
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
