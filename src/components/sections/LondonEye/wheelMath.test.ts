import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  activeIndex,
  BOARDING,
  capsuleAngle,
  featuredCapsules,
  rotationForIndex,
  TAU,
} from './wheelMath.ts'

const close = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-9, `${a} ≈ ${b}`)
const norm = (a: number) => ((a % TAU) + TAU) % TAU

test('featured capsules are evenly spaced and distinct', () => {
  assert.deepEqual(featuredCapsules(4, 32), [0, 8, 16, 24])
  assert.deepEqual(featuredCapsules(5, 32), [0, 6, 13, 19, 26])
  for (let n = 4; n <= 8; n++) assert.equal(new Set(featuredCapsules(n, 32)).size, n)
})

test('featured capsule i sits at the boarding point at subsection i', () => {
  const featured = featuredCapsules(5, 32)
  for (const boarding of [BOARDING.desktop, BOARDING.mobile]) {
    for (let i = 0; i < 5; i++) {
      const rot = rotationForIndex(i, featured, 32, boarding)
      close(norm(capsuleAngle(featured[i], 32) + rot), norm(boarding))
    }
  }
})

test('each next stop turns the wheel the same way (clockwise)', () => {
  const featured = featuredCapsules(6, 32)
  for (let i = 1; i < 6; i++) {
    assert.ok(rotationForIndex(i, featured, 32, 0) < rotationForIndex(i - 1, featured, 32, 0))
  }
})

test('active index rounds to the nearest stop and clamps', () => {
  assert.equal(activeIndex(0, 5), 0)
  assert.equal(activeIndex(0.12, 5), 0)
  assert.equal(activeIndex(0.13, 5), 1)
  assert.equal(activeIndex(1, 5), 4)
  assert.equal(activeIndex(1.4, 5), 4)
  assert.equal(activeIndex(-1, 5), 0)
})
