import type { SiteContent } from '@/content/site'
import type { SectionProps } from '@/content/types'

/** Site footer and contact details. Server component; all copy comes from site.ts. */
export function Footer({ id, content }: SectionProps<SiteContent>) {
  const { contact, social, footer } = content
  return (
    <footer id={id} className="bg-ink text-stone">
      <div className="mx-auto grid max-w-(--content-max) grid-cols-4 gap-x-(--grid-gutter) gap-y-12 px-(--page-margin) py-(--space-12) md:grid-cols-12">
        <div className="col-span-4 md:col-span-5">
          <p className="font-display text-step-3 leading-snug">{content.name}</p>
          <p className="mt-4 max-w-[40ch] text-step-0 leading-body text-stone-80">{footer.blurb}</p>
        </div>
        <address className="col-span-4 text-step-0 leading-body text-stone-80 not-italic md:col-span-3 md:col-start-7">
          {contact.address.street}
          <br />
          {contact.address.locality} {contact.address.postcode}
          <br />
          <a className="link" href={`mailto:${contact.email}`}>
            {contact.email}
          </a>
          <br />
          <a className="link" href={`tel:${contact.phone.replace(/\s/g, '')}`}>
            {contact.phone}
          </a>
        </address>
        <ul className="col-span-4 flex flex-col gap-2 text-step-0 md:col-span-2 md:col-start-11">
          {social.map((link) => (
            <li key={link.label}>
              <a className="link" href={link.href}>
                {link.label}
              </a>
            </li>
          ))}
        </ul>
        <p className="col-span-4 text-step--1 text-stone-60 md:col-span-12">{footer.legal}</p>
      </div>
    </footer>
  )
}
