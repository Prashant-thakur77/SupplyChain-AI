"use client"

import { useRef, type ReactNode } from "react"
import { motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion"

interface MagneticProps {
  children: ReactNode
  className?: string
  /** How far the element is pulled toward the cursor (px range). */
  strength?: number
}

/**
 * Wraps content so it gently follows the cursor on hover — the classic
 * award-site "magnetic" CTA effect. No-op under reduced motion.
 */
export function Magnetic({ children, className, strength = 0.35 }: MagneticProps) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 260, damping: 18, mass: 0.4 })
  const sy = useSpring(y, { stiffness: 260, damping: 18, mass: 0.4 })

  if (reduce) {
    return <div className={className}>{children}</div>
  }

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const relX = e.clientX - (rect.left + rect.width / 2)
    const relY = e.clientY - (rect.top + rect.height / 2)
    x.set(relX * strength)
    y.set(relY * strength)
  }

  const reset = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      ref={ref}
      className={`inline-block ${className ?? ""}`}
      style={{ x: sx, y: sy }}
      onMouseMove={handleMove}
      onMouseLeave={reset}
    >
      {children}
    </motion.div>
  )
}
