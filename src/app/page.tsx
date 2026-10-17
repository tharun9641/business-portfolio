import { Fragment } from 'react'
import { sections } from '@/components/sections/registry'

export default function Home() {
  return (
    <main id="main" tabIndex={-1} className="outline-none">
      {sections.map((section) => (
        <Fragment key={section.id}>{section.render()}</Fragment>
      ))}
    </main>
  )
}
