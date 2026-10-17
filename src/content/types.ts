/** Shared content shapes. Every content file in src/content is typed against these. */

export type ImageAsset = {
  /** Path under /public, e.g. '/assets/eye/sub-01.avif'. */
  src: string
  /** Describe the image; use '' only for purely decorative images. */
  alt: string
  width: number
  height: number
}

export type Link = { label: string; href: string }

/** Props every registry section receives. */
export type SectionProps<C> = {
  id: string
  content: C
}
