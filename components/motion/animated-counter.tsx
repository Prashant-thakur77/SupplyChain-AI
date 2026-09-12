"use client"

import { useEffect, useRef, useState } from "react"
import { useInView, useReducedMotion } from "framer-motion"

interface AnimatedCounterProps {
  /** Target value to count up to. */
  value: number
  /** Text rendered before the number (e.g. "$"). */
  prefix?: string
  /** Text rendered after the number (e.g. "K", "%"). */
  suffix?: string
  /** Decimal places to display. */
  decimals?: number
  /** Duration of the count animation in ms. */
  duration?: number
  className?: string
}

/**
 * Counts a number up from zero to `value` once it scrolls into view.
 * Renders the final value immediately when reduced motion is preferred.
 */
export function AnimatedCounter({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  duration = 1600,
  className,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: "-60px" })
  const reduce = useReducedMotion()
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!inView) return
    if (reduce) {
      setDisplay(value)
      return
    }

    let raf = 0
    let startTs: number | null = null
    const easeOutQuint = (t: number) => 1 - Math.pow(1 - t, 5)

    const tick = (ts: number) => {
      if (startTs === null) startTs = ts
      const progress = Math.min((ts - startTs) / duration, 1)
      setDisplay(value * easeOutQuint(progress))
      if (progress < 1) raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, reduce, value, duration])

  const formatted = display.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })

  return (
    <span ref={ref} className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  )
}
