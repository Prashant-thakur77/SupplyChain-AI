"use client"

import { motion, useReducedMotion } from "framer-motion"
import type { ReactNode } from "react"

interface MarqueeProps {
  children: ReactNode
  /** Seconds for one full loop. Lower = faster. */
  speed?: number
  className?: string
}

/**
 * Infinite horizontal scroll strip. Duplicates its children so the loop is
 * seamless. When reduced motion is preferred, it renders a static, centered row.
 */
export function Marquee({ children, speed = 32, className }: MarqueeProps) {
  const reduce = useReducedMotion()

  if (reduce) {
    return (
      <div className={className}>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
          {children}
        </div>
      </div>
    )
  }

  return (
    <div className={`marquee-mask overflow-hidden ${className ?? ""}`}>
      <motion.div
        className="flex w-max shrink-0 items-center"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: speed, ease: "linear", repeat: Infinity }}
      >
        <div className="flex shrink-0 items-center gap-x-10">{children}</div>
        <div className="flex shrink-0 items-center gap-x-10" aria-hidden>
          {children}
        </div>
      </motion.div>
    </div>
  )
}
