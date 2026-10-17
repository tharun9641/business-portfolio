import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, Hanken_Grotesk } from 'next/font/google'
import { SmoothScrollProvider } from '@/components/motion/SmoothScrollProvider'
import { sections } from '@/components/sections/registry'
import { Nav } from '@/components/ui/Nav'
import { site } from '@/content/site'
import './globals.css'

const cormorant = Cormorant_Garamond({
  variable: '--font-cormorant',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  display: 'swap',
})

const hanken = Hanken_Grotesk({
  variable: '--font-hanken',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} | ${site.tagline}`, template: `%s | ${site.name}` },
  description: site.description,
  openGraph: {
    type: 'website',
    locale: site.locale,
    siteName: site.name,
    title: site.name,
    description: site.description,
  },
}

export const viewport: Viewport = {
  themeColor: '#0b1220',
  colorScheme: 'dark',
}

const navItems = sections.flatMap((s) => (s.navLabel ? [{ id: s.id, label: s.navLabel }] : []))

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en-GB"
      className={`${cormorant.variable} ${hanken.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Runs before first paint so motion-only CSS can pre-hide entrances without a flash. */}
        <script
          dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }}
        />
      </head>
      <body>
        <a href="#main" className="skip-link">
          {site.nav.skipLabel}
        </a>
        <SmoothScrollProvider>
          <Nav items={navItems} />
          {children}
        </SmoothScrollProvider>
      </body>
    </html>
  )
}
