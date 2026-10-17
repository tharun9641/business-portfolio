import { test } from 'node:test'
import assert from 'node:assert/strict'
import { classifyTier, type TierSignals } from './deviceTier.ts'

const desktop: TierSignals = { cores: 10, memory: 8, coarsePointer: false, webgl: true }

test('strong desktop is high', () => {
  assert.equal(classifyTier(desktop), 'high')
})

test('Safari desktop without deviceMemory is still high', () => {
  assert.equal(classifyTier({ ...desktop, memory: undefined }), 'high')
})

test('touch device is mid', () => {
  assert.equal(classifyTier({ ...desktop, coarsePointer: true }), 'mid')
})

test('no WebGL or a software renderer is low', () => {
  assert.equal(classifyTier({ ...desktop, webgl: false }), 'low')
  assert.equal(classifyTier({ ...desktop, renderer: 'Google SwiftShader' }), 'low')
})

test('slow network, data saver or weak hardware is low', () => {
  assert.equal(classifyTier({ ...desktop, connection: 'slow-2g' }), 'low')
  assert.equal(classifyTier({ ...desktop, connection: '3g' }), 'low')
  assert.equal(classifyTier({ ...desktop, connection: '4g' }), 'high')
  assert.equal(classifyTier({ ...desktop, saveData: true }), 'low')
  assert.equal(classifyTier({ ...desktop, memory: 2 }), 'low')
  assert.equal(classifyTier({ ...desktop, cores: 2 }), 'low')
})

test('mid-range laptop is mid', () => {
  assert.equal(classifyTier({ ...desktop, cores: 4, memory: 4 }), 'mid')
})
