import type { Metadata } from 'next'
import { TemplateSection } from '@/components/sections/_Template/TemplateSection'
import { demoContent } from '@/content/sections/demo'
import { templateContent } from '@/content/sections/template'

export const metadata: Metadata = {
  title: 'Section template',
  robots: { index: false, follow: false },
}

/** Keeps the _Template section rendered and tested while it isn't on the home page. */
export default function TemplatePage() {
  return (
    <main id="main" tabIndex={-1} className="outline-none">
      <h1 className="sr-only">Section template</h1>
      <TemplateSection id="studio" content={templateContent} />
      <TemplateSection id="approach" content={demoContent} />
    </main>
  )
}
