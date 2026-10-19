'use client'

import { useCallback, useImperativeHandle, useLayoutEffect, useRef } from 'react'
import { BOARDING, capsuleAngle, capsuleAt } from './wheelMath'
import { CAPSULE, type WheelProps } from './types'

const deg = (r: number) => (r * 180) / Math.PI

/**
 * SVG London Eye with the same API as Wheel3D. Used on low-tier devices, without WebGL, under
 * reduced motion, and as the stand-in while the 3D chunk loads, so its cabins are drawn like the
 * 3D ones: a glass capsule with end frames, a floor and a warm interior, in a steel mounting ring.
 * Capsules counter-rotate to stay level. Hidden from assistive tech: the tab list is the
 * accessible control.
 */
export function Wheel2D({
  layout,
  capsules,
  featured,
  initialRotation,
  handleRef,
  onSelect,
}: WheelProps) {
  const wheel = useRef<SVGGElement>(null)
  const pods = useRef<(SVGGElement | null)[]>([])
  const last = useRef(initialRotation)
  const { width, height, hubX, hubY, radius: R, mobile } = layout
  const boarding = mobile ? BOARDING.mobile : BOARDING.desktop

  const apply = useCallback(
    (rot: number) => {
      last.current = rot
      // SVG's y axis points down, so a maths (counter-clockwise) rotation is a negative SVG angle.
      wheel.current?.setAttribute('transform', `translate(${hubX} ${hubY}) rotate(${-deg(rot)})`)
      for (const pod of pods.current) pod?.setAttribute('transform', `rotate(${deg(rot)})`)
      // The light lives at the boarding point and passes from pod to pod as they ride through it.
      const lit = capsuleAt(rot, boarding, capsules)
      pods.current.forEach((el, c) => el?.toggleAttribute('data-lit', c === lit))
    },
    [hubX, hubY, boarding, capsules],
  )

  useImperativeHandle(handleRef, () => ({ setRotation: apply }), [apply])
  // A layout change re-renders the starting transform; restore wherever the wheel had got to.
  useLayoutEffect(() => apply(last.current), [apply])

  const podRadius = R * (1 + CAPSULE.offset)
  const rx = R * CAPSULE.halfLength
  const ry = R * CAPSULE.halfHeight
  // Mounting ring around each capsule, fixed to the rim by a short bracket (as on the real Eye).
  const ringR = rx * 1.05
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
        {/* A deep braced rim, like the real truss: outer and inner chords with diagonal ties. */}
        <circle r={R} fill="none" stroke={steel} strokeWidth={Math.max(2, R * 0.012)} />
        <circle r={R * 0.94} fill="none" stroke={steel} strokeWidth={Math.max(1.5, R * 0.008)} />
        {/* Rim truss: ties between the outer and inner chords, alternately straight and raked. */}
        {Array.from({ length: 96 }, (_, k) => {
          const a = (k / 96) * Math.PI * 2
          const b = ((k + (k % 2)) / 96) * Math.PI * 2
          return (
            <line
              key={`t${k}`}
              x1={R * 0.94 * Math.cos(a)}
              y1={-R * 0.94 * Math.sin(a)}
              x2={R * Math.cos(b)}
              y2={-R * Math.sin(b)}
              stroke={steel}
              strokeOpacity={0.85}
              strokeWidth={Math.max(1, R * 0.004)}
            />
          )
        })}
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
          return (
            <g
              key={c}
              transform={`translate(${podRadius * Math.cos(a)} ${-podRadius * Math.sin(a)})`}
              onClick={f === -1 ? undefined : () => onSelect(f)}
              className={f === -1 ? undefined : 'cursor-pointer'}
            >
              <line
                className="eye-cabin-frame"
                x1={-Math.cos(a) * ringR}
                y1={Math.sin(a) * ringR}
                x2={-Math.cos(a) * (podRadius - R)}
                y2={Math.sin(a) * (podRadius - R)}
              />
              <circle className="eye-cabin-ring" r={ringR} />
              <g
                ref={(el) => void (pods.current[c] = el)}
                className="eye-cabin"
                transform={`rotate(${deg(initialRotation)})`}
              >
                <ellipse className="eye-cabin-glow" rx={rx * 0.72} ry={ry * 0.62} />
                <ellipse className="eye-pod" rx={rx} ry={ry} />
                {[-1, 1].map((side) => (
                  <line
                    key={side}
                    className="eye-cabin-frame"
                    x1={side * rx * 0.62}
                    y1={-ry * 0.82}
                    x2={side * rx * 0.62}
                    y2={ry * 0.82}
                  />
                ))}
                <line
                  className="eye-cabin-frame"
                  x1={-rx * 0.74}
                  y1={ry * 0.48}
                  x2={rx * 0.74}
                  y2={ry * 0.48}
                />
              </g>
            </g>
          )
        })}
      </g>
    </svg>
  )
}
