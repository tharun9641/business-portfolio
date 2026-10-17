'use client'

import { useImperativeHandle, useRef } from 'react'
import { capsuleAngle } from './wheelMath'
import { CAPSULE, type WheelProps } from './types'

const deg = (r: number) => (r * 180) / Math.PI

/**
 * SVG London Eye with the same API as Wheel3D. Used on low-tier devices, without WebGL, under
 * reduced motion, and as the stand-in while the 3D chunk loads. Capsules counter-rotate to stay
 * level. Hidden from assistive tech: the tab list is the accessible control.
 */
export function Wheel2D({
  layout,
  capsules,
  featured,
  active,
  initialRotation,
  handleRef,
  onSelect,
}: WheelProps) {
  const wheel = useRef<SVGGElement>(null)
  const pods = useRef<(SVGGElement | null)[]>([])
  const { width, height, hubX, hubY, radius: R } = layout

  useImperativeHandle(
    handleRef,
    () => ({
      setRotation: (rot) => {
        // SVG's y axis points down, so a maths (counter-clockwise) rotation is a negative SVG angle.
        wheel.current?.setAttribute('transform', `translate(${hubX} ${hubY}) rotate(${-deg(rot)})`)
        for (const pod of pods.current) pod?.setAttribute('transform', `rotate(${deg(rot)})`)
      },
    }),
    [hubX, hubY],
  )

  const podRadius = R * (1 + CAPSULE.offset)
  const rx = R * CAPSULE.halfLength
  const ry = R * CAPSULE.halfHeight
  const steel = 'rgb(201 210 220 / 0.85)'
  const legs = [-0.32, 0.32].map((dx) => [hubX + dx * R * 1.1, hubY + R * 1.35])

  return (
    <svg
      aria-hidden
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="absolute inset-0 overflow-visible"
    >
      {legs.map(([x, y]) => (
        <line
          key={x}
          x1={hubX}
          y1={hubY}
          x2={x}
          y2={y}
          stroke={steel}
          strokeWidth={Math.max(1.5, R * 0.01)}
        />
      ))}
      <g ref={wheel} transform={`translate(${hubX} ${hubY}) rotate(${-deg(initialRotation)})`}>
        <circle r={R} fill="none" stroke={steel} strokeWidth={Math.max(1.5, R * 0.012)} />
        <circle r={R * 0.97} fill="none" stroke={steel} strokeOpacity={0.5} strokeWidth={1} />
        {Array.from({ length: capsules * 2 }, (_, k) => {
          const a = (k / (capsules * 2)) * Math.PI * 2
          return (
            <line
              key={k}
              x1={0}
              y1={0}
              x2={R * Math.cos(a)}
              y2={-R * Math.sin(a)}
              stroke={steel}
              strokeOpacity={0.35}
              strokeWidth={0.75}
            />
          )
        })}
        <circle r={R * 0.05} fill="rgb(201 210 220)" />
        {Array.from({ length: capsules }, (_, c) => {
          const a = capsuleAngle(c, capsules)
          const f = featured.indexOf(c)
          const isActive = f !== -1 && f === active
          return (
            <g
              key={c}
              transform={`translate(${podRadius * Math.cos(a)} ${-podRadius * Math.sin(a)})`}
              onClick={f === -1 ? undefined : () => onSelect(f)}
              className={f === -1 ? undefined : 'cursor-pointer'}
            >
              <g
                ref={(el) => void (pods.current[c] = el)}
                transform={`rotate(${deg(initialRotation)})`}
              >
                <ellipse
                  rx={rx}
                  ry={ry}
                  fill={isActive ? 'var(--lamp)' : 'rgb(232 182 90 / 0.28)'}
                  stroke="rgb(232 226 214 / 0.7)"
                  strokeWidth={1}
                  style={{
                    transform: `scale(${isActive ? 1.08 : 1})`,
                    transition:
                      'transform 0.6s var(--ease-entrance), fill 0.6s var(--ease-entrance)',
                    filter: isActive ? 'drop-shadow(0 0 10px rgb(232 182 90 / 0.8))' : undefined,
                  }}
                />
              </g>
            </g>
          )
        })}
      </g>
    </svg>
  )
}
