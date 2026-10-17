import { test } from 'node:test'
import assert from 'node:assert/strict'
import { guidedFilter, pushPullFill } from '../lib.mjs'

test('push-pull fills holes smoothly and leaves known pixels alone', () => {
  const w = 64
  const h = 8
  const rgb = new Float32Array(w * h * 3)
  const wt = new Float32Array(w * h)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x
      rgb.fill(x < 32 ? 0.2 : 0.8, i * 3, i * 3 + 3)
      wt[i] = x < 20 || x > 44 ? 1 : 0
    }
  }
  const out = pushPullFill(rgb, wt, w, h)
  const row = Array.from({ length: w }, (_, x) => out[(3 * w + x) * 3])
  assert.ok(Math.abs(row[0] - 0.2) < 1e-6 && Math.abs(row[w - 1] - 0.8) < 1e-6)
  for (const v of row.slice(20, 45)) assert.ok(v >= 0.19 && v <= 0.81, `fill ${v} out of range`)
  assert.ok(row[22] < row[42], 'fill should grade from left to right')
})

test('guided filter snaps a blurry mask edge to the image edge', () => {
  const w = 40
  const h = 4
  const I = new Float32Array(w * h)
  const p = new Float32Array(w * h)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      I[y * w + x] = x < 20 ? 0.1 : 0.9
      p[y * w + x] = Math.min(1, Math.max(0, (x - 12) / 16)) // soft ramp from x=12..28
    }
  }
  const q = guidedFilter(I, p, w, h, 6, 1e-4)
  assert.ok(q[2 * w + 17] < 0.25, 'dark side should drop towards 0')
  assert.ok(q[2 * w + 23] > 0.75, 'bright side should rise towards 1')
})
