import { Fragment } from 'react'
import { sections } from '@/components/sections/registry'
import { site } from '@/content/site'

export default function Home() {
  return (
    <main id="main" tabIndex={-1} className="outline-none">
      <span id="top" />
      {/* Phase 1 only: the Tower Bridge hero (Phase 3) will own the page's single visible h1. */}
      <h1 className="sr-only">{site.name}</h1>
      {sections.map((section) => (
        <Fragment key={section.id}>{section.render()}</Fragment>
      ))}
    </main>
  )
}
