/** Contact form validation, shared by the server action and its tests. No framework imports. */

export type ContactField = 'name' | 'email' | 'message'
export type ContactValues = Record<ContactField, string>
export type ContactErrors = Partial<Record<ContactField, string>>

export type ContactMessages = {
  nameRequired: string
  emailInvalid: string
  messageTooShort: string
  messageTooLong: string
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
export const LIMITS = { name: 100, email: 254, messageMin: 10, messageMax: 2000 } as const

/** Trims, bounds and validates raw form input. Returns clean values or field errors. */
export function validateContact(
  raw: Partial<Record<ContactField | 'company', unknown>>,
  messages: ContactMessages,
):
  | { ok: true; values: ContactValues }
  | { ok: false; errors: ContactErrors; values: ContactValues; spam?: true } {
  const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
  const values: ContactValues = {
    name: str(raw.name, LIMITS.name),
    email: str(raw.email, LIMITS.email),
    message: str(raw.message, LIMITS.messageMax + 1),
  }
  // Honeypot: real visitors never see or fill this field.
  if (typeof raw.company === 'string' && raw.company.trim() !== '') {
    return { ok: false, errors: {}, values, spam: true }
  }
  const errors: ContactErrors = {}
  if (values.name.length < 2) errors.name = messages.nameRequired
  if (!EMAIL.test(values.email)) errors.email = messages.emailInvalid
  if (values.message.length < LIMITS.messageMin) errors.message = messages.messageTooShort
  else if (values.message.length > LIMITS.messageMax) errors.message = messages.messageTooLong
  return Object.keys(errors).length ? { ok: false, errors, values } : { ok: true, values }
}

/**
 * Fixed-window rate limiter keyed by client (IP). In-memory per server instance.
 * shortcut: per-instance memory, so limits reset on cold start and aren't shared across regions; move
 * to a shared store (e.g. Vercel KV) if spam ever gets through.
 */
export function createRateLimiter(limit: number, windowMs: number) {
  const hits = new Map<string, { count: number; start: number }>()
  return (key: string, now = Date.now()): boolean => {
    const h = hits.get(key)
    if (!h || now - h.start > windowMs) {
      hits.set(key, { count: 1, start: now })
      return true
    }
    h.count++
    return h.count <= limit
  }
}
