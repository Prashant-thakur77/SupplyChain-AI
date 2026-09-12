"use client"

import { motion } from "framer-motion"

interface RiskGaugeProps {
  /** 0–1 risk score */
  score: number
  /** "High Risk" | "Low Risk" */
  label: string
  /** 0–1 confidence */
  confidence: number
}

/**
 * SVG radial gauge that fills based on risk score.
 * Green → Amber → Red gradient with a center label.
 */
export function RiskGauge({ score, label, confidence }: RiskGaugeProps) {
  const size = 220
  const stroke = 18
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const arc = circumference * 0.75 // 270° arc
  const filled = arc * Math.min(Math.max(score, 0), 1)

  // Color based on score
  const hue = (1 - score) * 120 // 120 = green, 0 = red
  const color = `hsl(${hue}, 85%, 50%)`
  const glowColor = `hsla(${hue}, 85%, 50%, 0.35)`

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform rotate-[135deg]"
        >
          {/* Background arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            strokeDasharray={`${arc} ${circumference}`}
            strokeLinecap="round"
            className="text-slate-200 dark:text-slate-800"
          />
          {/* Filled arc */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeDasharray={`${filled} ${circumference}`}
            strokeLinecap="round"
            initial={{ strokeDasharray: `0 ${circumference}` }}
            animate={{ strokeDasharray: `${filled} ${circumference}` }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            style={{ filter: `drop-shadow(0 0 8px ${glowColor})` }}
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-4xl font-extrabold tracking-tight"
            style={{ color }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.4 }}
          >
            {(score * 100).toFixed(1)}%
          </motion.span>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mt-1">
            Risk Score
          </span>
        </div>
      </div>

      {/* Label badge */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold border ${
          label === "High Risk"
            ? "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30"
            : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
        }`}
      >
        <span
          className={`w-2 h-2 rounded-full ${
            label === "High Risk" ? "bg-red-500 animate-pulse" : "bg-emerald-500"
          }`}
        />
        {label}
      </motion.div>

      <p className="text-xs text-muted-foreground">
        Confidence: <span className="font-semibold">{(confidence * 100).toFixed(1)}%</span>
      </p>
    </div>
  )
}
