import type { ReactNode } from 'react'

type ButtonProps = {
  href: string
  children: ReactNode
  variant?: 'primary' | 'ghost'
  className?: string
  onClick?: React.MouseEventHandler<HTMLAnchorElement>
}

const variants = {
  primary: 'bg-bus text-on-bus hover:bg-bus-hover',
  ghost: 'border border-hairline text-stone hover:border-stone/60',
} as const

/**
 * Link styled as a button. --bus (primary) is reserved for the CTA. The lift and press are CSS
 * transitions, so the always-visible CTA adds no JavaScript to the first load.
 */
export function Button({ href, children, variant = 'primary', className, onClick }: ButtonProps) {
  return (
    <a
      href={href}
      onClick={onClick}
      className={`inline-flex min-h-11 items-center gap-2 rounded-full px-5 py-2.5 text-step--1 font-medium tracking-wide transition-[translate,scale,background-color,border-color] duration-(--dur-micro) ease-(--ease-entrance) hover:-translate-y-0.5 active:scale-[0.97] motion-reduce:transform-none motion-reduce:transition-colors ${variants[variant]} ${className ?? ''}`}
    >
      {children}
    </a>
  )
}
