"use client"

import { motion, useReducedMotion, type Variants } from "framer-motion"
import type { CSSProperties, ReactNode } from "react"

type Direction = "up" | "down" | "left" | "right" | "none"

const offset: Record<Direction, { x?: number; y?: number }> = {
  up: { y: 28 },
  down: { y: -28 },
  left: { x: 28 },
  right: { x: -28 },
  none: {},
}

interface RevealProps {
  children: ReactNode
  /** Slide direction as the element fades in. Default "up". */
  direction?: Direction
  /** Delay in seconds before the animation starts. */
  delay?: number
  /** Animation duration in seconds. */
  duration?: number
  className?: string
  /** Render as a different element for layout control. */
  as?: "div" | "section" | "li" | "span"
  once?: boolean
}

/**
 * Fades + slides its children into view when scrolled into the viewport.
 * Fully disabled (renders statically) when the user prefers reduced motion.
 */
export function Reveal({
  children,
  direction = "up",
  delay = 0,
  duration = 0.6,
  className,
  as = "div",
  once = true,
}: RevealProps) {
  const reduce = useReducedMotion()
  const MotionTag = motion[as]

  if (reduce) {
    const Tag = as
    return <Tag className={className}>{children}</Tag>
  }

  const variants: Variants = {
    hidden: { opacity: 0, ...offset[direction] },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: { duration, delay, ease: [0.16, 1, 0.3, 1] },
    },
  }

  return (
    <MotionTag
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: "-80px" }}
    >
      {children}
    </MotionTag>
  )
}

/**
 * Staggers the reveal of direct children. Pair with <RevealItem>.
 */
export function RevealGroup({
  children,
  className,
  stagger = 0.08,
  as = "div",
}: {
  children: ReactNode
  className?: string
  stagger?: number
  as?: "div" | "section" | "ul"
}) {
  const reduce = useReducedMotion()
  const MotionTag = motion[as]

  if (reduce) {
    const Tag = as
    return <Tag className={className}>{children}</Tag>
  }

  return (
    <MotionTag
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={{ visible: { transition: { staggerChildren: stagger } } }}
    >
      {children}
    </MotionTag>
  )
}

export function RevealItem({
  children,
  className,
  direction = "up",
  as = "div",
  style,
}: {
  children: ReactNode
  className?: string
  direction?: Direction
  as?: "div" | "li" | "span"
  style?: CSSProperties
}) {
  const reduce = useReducedMotion()
  const MotionTag = motion[as]

  if (reduce) {
    const Tag = as
    return <Tag className={className} style={style}>{children}</Tag>
  }

  const variants: Variants = {
    hidden: { opacity: 0, ...offset[direction] },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
    },
  }

  return (
    <MotionTag className={className} style={style} variants={variants}>
      {children}
    </MotionTag>
  )
}
