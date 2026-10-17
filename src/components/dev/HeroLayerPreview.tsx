'use client'

import Image from 'next/image'
import { useId, useState, type CSSProperties } from 'react'
import type { HeroLayer } from '@/content/dev/contactSheet'

type Geometry = {
  canvas: { w: number; h: number }
  bascules: Record<'left' | 'right', { pivot: number[] }>
}

type Props = {
  layers: HeroLayer[]
  geometry: Geometry
  angleLabel: string
  separationLabel: string
}

/** Review-only stack of the hero layers with a bascule-angle and depth-separation control. */
export function HeroLayerPreview({ layers, geometry, angleLabel, separationLabel }: Props) {
  const [angle, setAngle] = useState(0)
  const [separation, setSeparation] = useState(0)
  const angleId = useId()
  const sepId = useId()
  const { w, h } = geometry.canvas

  const styleFor = (layer: HeroLayer): CSSProperties => {
    const lift = `translateY(${(-layer.depth * separation).toFixed(1)}%)`
    if (!layer.bascule) return { transform: lift }
    const [px, py] = geometry.bascules[layer.bascule].pivot
    const sign = layer.bascule === 'left' ? -1 : 1
    return {
      transform: `${lift} rotate(${sign * angle}deg)`,
      transformOrigin: `${(px / w) * 100}% ${(py / h) * 100}%`,
    }
  }

  return (
    <div>
      <div
        className="relative w-full overflow-hidden rounded-sm bg-ink"
        style={{ aspectRatio: `${w} / ${h}` }}
      >
        {layers.map((layer) => (
          <div key={layer.src} className="absolute inset-0" style={styleFor(layer)}>
            <Image
              src={layer.src}
              alt=""
              fill
              sizes="(min-width: 1440px) 1340px, 100vw"
              className="object-cover"
            />
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <label htmlFor={angleId} className="flex flex-col gap-2 text-step--1 text-stone-80">
          <span>
            {angleLabel}: {angle}°
          </span>
          <input
            id={angleId}
            type="range"
            min={0}
            max={80}
            value={angle}
            onChange={(e) => setAngle(Number(e.target.value))}
            className="accent-lamp"
          />
        </label>
        <label htmlFor={sepId} className="flex flex-col gap-2 text-step--1 text-stone-80">
          <span>
            {separationLabel}: {separation}%
          </span>
          <input
            id={sepId}
            type="range"
            min={0}
            max={40}
            value={separation}
            onChange={(e) => setSeparation(Number(e.target.value))}
            className="accent-lamp"
          />
        </label>
      </div>
    </div>
  )
}
