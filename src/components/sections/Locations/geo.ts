/**
 * Tiny equirectangular projection for a central-London map. Accurate enough at city scale
 * (< 0.5% distortion across 6 km); keeps real geography without a map library or tiles.
 */

export type LatLon = [lat: number, lon: number]

export const BOUNDS = { north: 51.5185, south: 51.4855, west: -0.152, east: -0.06 } as const
const COS_LAT = Math.cos((51.502 * Math.PI) / 180)

/** viewBox width; height follows from the bounds so distances stay true. */
export const MAP_W = 1000
export const MAP_H = Math.round(
  (MAP_W * (BOUNDS.north - BOUNDS.south)) / ((BOUNDS.east - BOUNDS.west) * COS_LAT),
)

export function project([lat, lon]: LatLon): [x: number, y: number] {
  const x = ((lon - BOUNDS.west) / (BOUNDS.east - BOUNDS.west)) * MAP_W
  const y = ((BOUNDS.north - lat) / (BOUNDS.north - BOUNDS.south)) * MAP_H
  return [Math.round(x * 10) / 10, Math.round(y * 10) / 10]
}

/** Centre line of the Thames, west to east (Vauxhall → Wapping), from bridge positions. */
export const THAMES: LatLon[] = [
  [51.4862, -0.1335],
  [51.4876, -0.1272],
  [51.4945, -0.1237],
  [51.5008, -0.1218],
  [51.5065, -0.1203],
  [51.5087, -0.117],
  [51.5097, -0.1105],
  [51.5098, -0.1043],
  [51.5096, -0.0985],
  [51.5087, -0.0946],
  [51.5079, -0.0877],
  [51.5068, -0.0805],
  [51.5055, -0.0754],
  [51.5049, -0.0702],
  [51.5058, -0.0618],
]

/** Smooth SVG path (Catmull-Rom → cubic Bézier) through projected points. */
export function smoothPath(points: [number, number][]): string {
  if (points.length < 2) return ''
  const p = points
  let d = `M${p[0][0]} ${p[0][1]}`
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[Math.max(0, i - 1)]
    const p1 = p[i]
    const p2 = p[i + 1]
    const p3 = p[Math.min(p.length - 1, i + 2)]
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0]} ${p2[1]}`
  }
  return d
}
