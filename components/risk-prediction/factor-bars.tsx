"use client"

import { motion } from "framer-motion"

interface FactorBarsProps {
  factors: Record<string, number>
}

/**
 * Horizontal bar chart showing the top contributing risk factors.
 * Each bar animates in sequentially.
 */
export function FactorBars({ factors }: FactorBarsProps) {
  const entries = Object.entries(factors)
  if (entries.length === 0) return null

  const maxVal = Math.max(...entries.map(([, v]) => v))

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
        Top Contributing Factors
      </h4>
      {entries.map(([name, value], i) => {
        const pct = maxVal > 0 ? (value / maxVal) * 100 : 0
        return (
          <motion.div
            key={name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.12, duration: 0.4 }}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium text-foreground truncate max-w-[200px]">
                {formatFactorName(name)}
              </span>
              <span className="text-xs font-semibold text-muted-foreground tabular-nums ml-2">
                {value.toFixed(4)}
              </span>
            </div>
            <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: `linear-gradient(90deg, hsl(${220 - i * 25}, 80%, 55%), hsl(${220 - i * 25}, 80%, 45%))`,
                }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ delay: 0.5 + i * 0.12, duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

/** Convert snake_case / camelCase factor names to readable labels */
function formatFactorName(name: string): string {
  return name
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}
