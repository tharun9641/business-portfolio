import type { Link } from './types'

/**
 * Business details, CTA and SEO. Dummy values: see docs/CONTENT_NEEDED.md for what to replace.
 */
export type SiteContent = {
  name: string
  shortName: string
  tagline: string
  description: string
  url: string
  locale: string
  /** shortLabel is used where space is tight (nav on phones). */
  cta: Link & { shortLabel: string }
  contact: {
    email: string
    phone: string
    address: { street: string; locality: string; postcode: string; country: string }
  }
  social: Link[]
  footer: { blurb: string; legal: string }
  nav: { menuLabel: string; closeLabel: string; skipLabel: string }
}

export const site: SiteContent = {
  name: 'Halden & Vale',
  shortName: 'H&V',
  tagline: 'Architecture and interiors for London homes, designed at the hour the city glows.',
  description:
    'Halden & Vale is a London architecture and interior design studio creating calm, light-filled homes, from first sketch to the evening you switch the lamps on.',
  url: 'https://example.com',
  locale: 'en_GB',
  cta: { label: 'Book a consultation', shortLabel: 'Book a call', href: '#contact' },
  contact: {
    email: 'hello@haldenvale.example',
    phone: '+44 20 0000 0000',
    address: {
      street: '1 Shad Thames',
      locality: 'London',
      postcode: 'SE1 2YG',
      country: 'GB',
    },
  },
  social: [
    { label: 'Instagram', href: '#' },
    { label: 'LinkedIn', href: '#' },
    { label: 'Pinterest', href: '#' },
  ],
  footer: {
    blurb: 'A small studio by the river, drawing homes for the way London light falls.',
    legal: '© 2026 Halden & Vale Ltd. Registered in England and Wales.',
  },
  nav: { menuLabel: 'Menu', closeLabel: 'Close', skipLabel: 'Skip to content' },
}
