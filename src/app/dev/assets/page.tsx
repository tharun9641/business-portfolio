import type { Metadata } from 'next'
import Image from 'next/image'
import { HeroLayerPreview } from '@/components/dev/HeroLayerPreview'
import { contactSheet as c } from '@/content/dev/contactSheet'

export const metadata: Metadata = {
  title: c.title,
  robots: { index: false, follow: false },
}

const checker = 'bg-[repeating-conic-gradient(#1c3550_0%_25%,#0b1220_0%_50%)] bg-size-[24px_24px]'

export default function AssetsPage() {
  return (
    <main
      id="main"
      tabIndex={-1}
      className="mx-auto max-w-(--content-max) px-(--page-margin) pt-28 pb-(--space-16) outline-none"
    >
      <h1 className="font-display text-step-5 leading-tight text-stone">{c.title}</h1>
      <p className="mt-4 max-w-[70ch] text-step-0 text-stone-80">{c.intro}</p>

      <section aria-labelledby="cmp" className="mt-(--space-12)">
        <h2 id="cmp" className="font-display text-step-3 text-stone">
          {c.comparisonsHeading}
        </h2>
        <ul className="mt-6 grid gap-6 md:grid-cols-2">
          {c.comparisons.map((item) => (
            <li key={item.src}>
              <figure>
                <div className="relative aspect-[4240/2832] overflow-hidden rounded-sm">
                  <Image
                    src={item.src}
                    alt={item.label}
                    fill
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className="object-cover"
                  />
                </div>
                <figcaption className="mt-2 text-step--1 text-stone-60">{item.label}</figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="stack" className="mt-(--space-12)">
        <h2 id="stack" className="font-display text-step-3 text-stone">
          {c.stackHeading}
        </h2>
        <p className="mt-2 mb-6 max-w-[70ch] text-step-0 text-stone-80">{c.stackIntro}</p>
        <HeroLayerPreview
          layers={c.heroLayers}
          geometry={c.geometry}
          angleLabel={c.angleLabel}
          separationLabel={c.separationLabel}
        />
      </section>

      <section aria-labelledby="eye" className="mt-(--space-12)">
        <h2 id="eye" className="font-display text-step-3 text-stone">
          {c.eyeHeading}
        </h2>
        <figure className="mt-6">
          <div className="relative aspect-[1440/800] overflow-hidden rounded-sm">
            <Image
              src={c.eyeMaster.src}
              alt={c.eyeMaster.label}
              fill
              sizes="100vw"
              className="object-cover"
            />
          </div>
          <figcaption className="mt-2 text-step--1 text-stone-60">{c.eyeMaster.label}</figcaption>
        </figure>
      </section>

      <section aria-labelledby="grid" className="mt-(--space-12)">
        <h2 id="grid" className="font-display text-step-3 text-stone">
          {c.gridHeading}
        </h2>
        <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {c.assets.map((a) => {
            const placeholder = c.placeholders.includes(a.src)
            const status = !a.ok
              ? c.labels.over
              : placeholder
                ? c.labels.placeholder
                : c.labels.ready
            return (
              <li key={a.src} className="rounded-sm border border-hairline p-3">
                <div
                  className={`relative overflow-hidden ${checker}`}
                  style={{ aspectRatio: `${a.width} / ${a.height}` }}
                >
                  <Image
                    src={a.src}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 30vw, 90vw"
                    className="object-contain"
                  />
                </div>
                <p className="mt-3 font-mono text-step--1 break-all text-stone">{a.src}</p>
                <p className="mt-1 flex flex-wrap items-center gap-x-3 text-step--1 text-stone-60">
                  <span>
                    {a.width}×{a.height}
                    {a.alpha ? ` · ${c.labels.alpha}` : ''}
                  </span>
                  <span>
                    {a.servedKB} / {a.budgetKB} KB
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 ${!a.ok ? 'bg-bus text-stone' : placeholder ? 'bg-dusk text-stone' : 'bg-thames text-lamp'}`}
                  >
                    {status}
                  </span>
                </p>
              </li>
            )
          })}
        </ul>
      </section>
    </main>
  )
}
