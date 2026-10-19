import type { ContactMessages } from '@/lib/contact'

export type ContactContent = {
  heading: string
  intro: string
  /** Shown beside the form so visitors can reach the studio directly. */
  direct: { label: string }
  fields: {
    name: { label: string; autoComplete: string }
    email: { label: string; autoComplete: string }
    message: { label: string; hint: string }
  }
  /** Honeypot label (visually hidden, never announced). */
  honeypot: string
  submit: { idle: string; pending: string }
  success: string
  failure: string
  rateLimited: string
  errors: ContactMessages
  layers: { src: string; depth: number }[]
}

export const contactContent: ContactContent = {
  heading: 'Book a consultation',
  intro:
    'Tell us about the house, the rooms and how you want them to feel. We reply within two working days, usually with a time to visit.',
  direct: { label: 'Or write to us directly' },
  fields: {
    name: { label: 'Your name', autoComplete: 'name' },
    email: { label: 'Email', autoComplete: 'email' },
    message: {
      label: 'About your project',
      hint: 'Address or area, scope and timing help us most.',
    },
  },
  honeypot: 'Company',
  submit: { idle: 'Send enquiry', pending: 'Sending…' },
  success: 'Thank you. Your enquiry is with us and we’ll be in touch within two working days.',
  failure: 'Something went wrong sending your enquiry. Please try again, or email us directly.',
  rateLimited: 'Too many enquiries from this connection. Please try again in a few minutes.',
  errors: {
    nameRequired: 'Please tell us your name.',
    emailInvalid: 'Please enter a valid email address.',
    messageTooShort: 'A few words about the project, please (at least 10 characters).',
    messageTooLong: 'Please keep it under 2,000 characters; we can talk through the rest.',
  },
  layers: [
    { src: '/assets/eye/sky.avif', depth: 0.05 },
    { src: '/assets/eye/far-bank.webp', depth: 0.25 },
    { src: '/assets/eye/water.webp', depth: 0.5 },
  ],
}
