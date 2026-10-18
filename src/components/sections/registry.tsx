import type { ComponentType, ReactNode } from 'react'
import { contactContent } from '@/content/sections/contact'
import { heroContent } from '@/content/sections/hero'
import { londonEyeContent } from '@/content/sections/londonEye'
import { site } from '@/content/site'
import type { SectionProps } from '@/content/types'
import { ContactBand } from './ContactBand/ContactBand'
import { TowerBridgeHero } from './TowerBridgeHero/TowerBridgeHero'
import { LondonEyeSection } from './LondonEye/LondonEyeSection'
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
  defineSection({ id: 'top', component: TowerBridgeHero, content: heroContent }),
  defineSection({
    id: 'process',
    navLabel: 'Process',
    component: LondonEyeSection,
    content: londonEyeContent,
  }),
  defineSection({
    id: 'contact',
    navLabel: 'Contact',
    component: ContactBand,
    content: contactContent,
  }),
  defineSection({ id: 'footer', component: Footer, content: site }),
]
