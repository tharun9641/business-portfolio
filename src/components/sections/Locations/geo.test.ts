import { test } from 'node:test'
import assert from 'node:assert/strict'
import { MAP_H, MAP_W, project, smoothPath, THAMES, type LatLon } from './geo.ts'

const landmarks: LatLon[] = [
  [51.5055, -0.0754], // Tower Bridge
  [51.5138, -0.0984], // St Paul's
  [51.5014, -0.1419], // Buckingham Palace
  [51.5033, -0.1196], // London Eye
]

test('map keeps a true aspect for central London (about 1.74 : 1)', () => {
  assert.ok(MAP_H > 560 && MAP_H < 590, `MAP_H ${MAP_H}`)
})

test('landmarks land inside the map, in the right relative places', () => {
  const pts = landmarks.map(project)
  for (const [x, y] of pts) assert.ok(x > 0 && x < MAP_W && y > 0 && y < MAP_H)
  const [tower, stPauls, palace, eye] = pts
  assert.ok(palace[0] < eye[0] && eye[0] < stPauls[0] && stPauls[0] < tower[0], 'west → east')
  assert.ok(stPauls[1] < tower[1], 'St Paul’s is north of Tower Bridge')
})

test('the Thames runs west to east and the path covers every point', () => {
  const pts = THAMES.map(project)
  for (let i = 1; i < pts.length; i++) assert.ok(pts[i][0] > pts[i - 1][0])
  const d = smoothPath(pts)
  assert.ok(d.startsWith(`M${pts[0][0]} ${pts[0][1]}`))
  assert.equal((d.match(/C/g) ?? []).length, pts.length - 1)
})
