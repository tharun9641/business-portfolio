'use server'

import { headers } from 'next/headers'
import { contactContent } from '@/content/sections/contact'
import { site } from '@/content/site'
import {
  createRateLimiter,
  validateContact,
  type ContactErrors,
  type ContactValues,
} from '@/lib/contact'

export type ContactState =
  | { status: 'idle' }
  | { status: 'invalid'; errors: ContactErrors; values: ContactValues }
  | { status: 'sent' }
  | { status: 'error'; message: string; values?: ContactValues }

const allow = createRateLimiter(5, 10 * 60 * 1000)

/**
 * Contact form server action (DECISIONS D-14). Delivery is chosen by env:
 *   MAIL_PROVIDER=resend  RESEND_API_KEY=…  CONTACT_TO=…  CONTACT_FROM=…
 *   MAIL_PROVIDER=log (default): logs a one-line summary, for dev and previews.
 */
export async function sendEnquiry(_prev: ContactState, form: FormData): Promise<ContactState> {
  const c = contactContent
  const result = validateContact(Object.fromEntries(form), c.errors)
  if (!result.ok) {
    // Pretend success to bots so they don't retry.
    if (result.spam) return { status: 'sent' }
    return { status: 'invalid', errors: result.errors, values: result.values }
  }

  const h = await headers()
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown'
  if (!allow(ip)) return { status: 'error', message: c.rateLimited, values: result.values }

  try {
    await deliver(result.values)
    return { status: 'sent' }
  } catch (err) {
    console.error('[contact] delivery failed', err instanceof Error ? err.message : err)
    return { status: 'error', message: c.failure, values: result.values }
  }
}

async function deliver({ name, email, message }: ContactValues) {
  const provider = process.env.MAIL_PROVIDER ?? 'log'
  if (provider === 'log') {
    // Never log the message body or address in full.
    console.info(
      `[contact] enquiry from ${name} <${email.replace(/^(.).*@/, '$1…@')}>, ${message.length} chars`,
    )
    return
  }
  if (provider === 'resend') {
    const key = process.env.RESEND_API_KEY
    const to = process.env.CONTACT_TO ?? site.contact.email
    const from = process.env.CONTACT_FROM
    if (!key || !from) throw new Error('RESEND_API_KEY and CONTACT_FROM must be set')
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to,
        reply_to: email,
        subject: `New enquiry from ${name}`,
        text: `${name} <${email}>\n\n${message}`,
      }),
    })
    if (!res.ok) throw new Error(`Resend responded ${res.status}`)
    return
  }
  throw new Error(`Unknown MAIL_PROVIDER "${provider}"`)
}
