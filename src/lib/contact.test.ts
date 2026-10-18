import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createRateLimiter, LIMITS, validateContact } from './contact.ts'

const messages = {
  nameRequired: 'name',
  emailInvalid: 'email',
  messageTooShort: 'short',
  messageTooLong: 'long',
}
const good = {
  name: ' Ada Lovelace ',
  email: 'ada@example.com',
  message: 'A kitchen and a garden room, please.',
}

test('valid input passes, trimmed', () => {
  const r = validateContact(good, messages)
  assert.equal(r.ok, true)
  assert.equal(r.values.name, 'Ada Lovelace')
})

test('each field reports its own error', () => {
  const r = validateContact({ name: 'A', email: 'not-an-email', message: 'hi' }, messages)
  assert.equal(r.ok, false)
  if (!r.ok) assert.deepEqual(r.errors, { name: 'name', email: 'email', message: 'short' })
})

test('overlong message is rejected, non-string input is treated as empty', () => {
  const long = validateContact({ ...good, message: 'x'.repeat(LIMITS.messageMax + 50) }, messages)
  assert.equal(long.ok, false)
  if (!long.ok) assert.equal(long.errors.message, 'long')
  const odd = validateContact({ name: 42, email: ['a@b.co'], message: null }, messages)
  assert.equal(odd.ok, false)
})

test('honeypot marks spam without field errors', () => {
  const r = validateContact({ ...good, company: 'Spam Ltd' }, messages)
  assert.equal(r.ok, false)
  if (!r.ok) assert.equal(r.spam, true)
})

test('rate limiter allows `limit` hits per window per key', () => {
  const allow = createRateLimiter(2, 1000)
  assert.equal(allow('ip', 0), true)
  assert.equal(allow('ip', 10), true)
  assert.equal(allow('ip', 20), false)
  assert.equal(allow('other', 20), true)
  assert.equal(allow('ip', 1100), true)
})
