import type { ComponentType, ReactNode } from 'react'
import { demoContent } from '@/content/sections/demo'
import { templateContent } from '@/content/sections/template'
import { site } from '@/content/site'
import type { SectionProps } from '@/content/types'
import { TemplateSection } from './_Template/TemplateSection'
import { Footer } from './Footer/Footer'

export type SectionEntry = {
  id: string
  /** Shown in the menu when set. */
  navLabel?: string
  render: () => ReactNode
}

/** Pairs a section component with its typed content, so each entry is checked at compile time. */
function defineSection<C>(entry: {
  id: string
  navLabel?: string
  component: ComponentType<SectionProps<C>>
  content: C
}): SectionEntry {
  const { id, navLabel, component: Component, content } = entry
  return { id, navLabel, render: () => <Component id={id} content={content} /> }
}

/** Page order. Adding a section = one line here (docs/SECTIONS.md). */
export const sections: SectionEntry[] = [
  defineSection({
    id: 'studio',
    navLabel: 'Studio',
    component: TemplateSection,
    content: templateContent,
  }),
  defineSection({
    id: 'approach',
    navLabel: 'Approach',
    component: TemplateSection,
    content: demoContent,
  }),
  defineSection({ id: 'contact', navLabel: 'Contact', component: Footer, content: site }),
]
