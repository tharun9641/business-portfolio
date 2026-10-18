import { Fragment } from 'react'
import { ScrollProgress } from '@/components/motion/ScrollProgress'
import { SectionCurtain, type SectionExit } from '@/components/motion/SectionCurtain'
import { sections } from '@/components/sections/registry'
import { site } from '@/content/site'

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  '@id': `${site.url}/#business`,
  name: site.name,
  description: site.description,
  url: site.url,
  image: `${site.url}/opengraph-image.jpg`,
  email: site.contact.email,
  telephone: site.contact.phone,
  address: {
    '@type': 'PostalAddress',
    streetAddress: site.contact.address.street,
    addressLocality: site.contact.address.locality,
    postalCode: site.contact.address.postcode,
    addressCountry: site.contact.address.country,
  },
  areaServed: 'London',
  sameAs: site.social.map((s) => s.href).filter((href) => href.startsWith('http')),
}

// The Ride holds still at its end while Locations scrolls up over it; Locations folds into a line
// that flips, dips and rises, bringing up the contact band (and reverses on the way back).
const exits: SectionExit[] = [
  { into: 'locations', effect: 'stick' },
  { into: 'contact', effect: 'line' },
]

export default function Home() {
  return (
    <main id="main" tabIndex={-1} className="outline-none">
      <script
        type="application/ld+json"
        // Escape "<" so content can never close the script tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <ScrollProgress />
      <SectionCurtain exits={exits} />
      {sections.map((section) => (
        <Fragment key={section.id}>{section.render()}</Fragment>
      ))}
    </main>
  )
}
