import { site } from '@/content/site'

/** Text wordmark until a real logo is supplied (docs/CONTENT_NEEDED.md). */
export function Logo({ className }: { className?: string }) {
  return (
    <a
      href="#top"
      className={`font-display text-step-1 leading-none font-medium tracking-display whitespace-nowrap text-stone ${className ?? ''}`}
    >
      {site.name}
    </a>
  )
}
