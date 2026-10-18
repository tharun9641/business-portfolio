'use client'

import { useActionState, useId } from 'react'
import { sendEnquiry, type ContactState } from '@/app/actions/contact'
import type { ContactContent } from '@/content/sections/contact'
import type { ContactField } from '@/lib/contact'

const initial: ContactState = { status: 'idle' }

const inputClass =
  'mt-2 w-full rounded-sm border border-hairline bg-ink/60 px-4 py-3 text-step-0 text-stone placeholder:text-stone-60 transition-colors duration-(--dur-micro) focus-visible:border-lamp aria-invalid:border-error'

/** Enquiry form: works without JS (server action), adds inline errors and pending state with it. */
export function ContactForm({ content }: { content: ContactContent }) {
  const [state, action, pending] = useActionState(sendEnquiry, initial)
  const uid = useId()
  const errors = state.status === 'invalid' ? state.errors : {}
  const values = state.status === 'invalid' || state.status === 'error' ? state.values : undefined
  const sent = state.status === 'sent'

  const field = (name: ContactField) => ({
    id: `${uid}-${name}`,
    name,
    defaultValue: values?.[name],
    'aria-invalid': errors[name] ? true : undefined,
    'aria-describedby':
      [errors[name] ? `${uid}-${name}-error` : '', name === 'message' ? `${uid}-hint` : '']
        .filter(Boolean)
        .join(' ') || undefined,
  })
  const error = (name: ContactField) =>
    errors[name] ? (
      <p id={`${uid}-${name}-error`} className="mt-2 text-step--1 text-error">
        {errors[name]}
      </p>
    ) : null

  return (
    // Remount after a successful send so the fields clear.
    <form key={sent ? 'sent' : 'form'} action={action} noValidate className="flex flex-col gap-6">
      <div>
        <label htmlFor={`${uid}-name`} className="text-step--1 text-stone-80">
          {content.fields.name.label}
        </label>
        <input
          {...field('name')}
          type="text"
          required
          autoComplete={content.fields.name.autoComplete}
          className={inputClass}
        />
        {error('name')}
      </div>
      <div>
        <label htmlFor={`${uid}-email`} className="text-step--1 text-stone-80">
          {content.fields.email.label}
        </label>
        <input
          {...field('email')}
          type="email"
          required
          autoComplete={content.fields.email.autoComplete}
          className={inputClass}
        />
        {error('email')}
      </div>
      <div>
        <label htmlFor={`${uid}-message`} className="text-step--1 text-stone-80">
          {content.fields.message.label}
        </label>
        <p id={`${uid}-hint`} className="mt-1 text-step--1 text-stone-60">
          {content.fields.message.hint}
        </p>
        <textarea {...field('message')} required rows={5} className={`${inputClass} resize-y`} />
        {error('message')}
      </div>

      {/* Honeypot: off-screen, out of the tab order and hidden from assistive tech. */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          {content.honeypot}
          <input type="text" name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-11 items-center rounded-full bg-bus px-6 py-3 text-step--1 font-medium tracking-wide text-on-bus transition-colors duration-(--dur-micro) hover:bg-bus-hover disabled:opacity-70"
        >
          {pending ? content.submit.pending : content.submit.idle}
        </button>
        <p role="status" aria-live="polite" className="text-step--1 text-stone-80">
          {sent ? content.success : state.status === 'error' ? state.message : ''}
        </p>
      </div>
    </form>
  )
}
