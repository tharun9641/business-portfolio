'use client'

import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { DURATION } from '@/lib/motion'

type ButtonProps = {
  href: string
  children: ReactNode
  variant?: 'primary' | 'ghost'
  className?: string
  onClick?: React.MouseEventHandler<HTMLAnchorElement>
}

const variants = {
  primary: 'bg-bus text-stone hover:bg-bus-hover',
  ghost: 'border border-hairline text-stone hover:border-stone/60',
} as const

/** Link styled as a button. --bus (primary) is reserved for the CTA. */
export function Button({ href, children, variant = 'primary', className, onClick }: ButtonProps) {
  return (
    <motion.a
      href={href}
      onClick={onClick}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: DURATION.micro / 2, ease: [0.215, 0.61, 0.355, 1] }}
      className={`inline-flex min-h-11 items-center gap-2 rounded-full px-5 py-2.5 text-step--1 font-medium tracking-wide transition-colors duration-(--dur-micro) ${variants[variant]} ${className ?? ''}`}
    >
      {children}
    </motion.a>
  )
}
