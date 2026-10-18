import { Fragment } from 'react'
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

export default function Home() {
  return (
    <main id="main" tabIndex={-1} className="outline-none">
      <script
        type="application/ld+json"
        // Escape "<" so content can never close the script tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      {sections.map((section) => (
        <Fragment key={section.id}>{section.render()}</Fragment>
      ))}
    </main>
  )
}
