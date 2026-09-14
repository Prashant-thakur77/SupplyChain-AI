"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { Check, ShieldAlert } from "lucide-react"

/**
 * The product in eight seconds, looping:
 *   0s  cargo flows Shenzhen → Singapore → Suez → Rotterdam → Berlin
 *   2s  Singapore fails (pulse), downstream lane dims
 *   3s  routing engine draws the reroute via Colombo
 *   4.5s decision card slides in, 6.5s "approved", 8s reset
 */
const N = {
  shenzhen: { x: 60, y: 150, label: "Shenzhen", sub: "factory" },
  singapore: { x: 210, y: 80, label: "Singapore", sub: "port" },
  colombo: { x: 210, y: 220, label: "Colombo", sub: "port" },
  suez: { x: 360, y: 150, label: "Suez", sub: "canal" },
  rotterdam: { x: 510, y: 90, label: "Rotterdam", sub: "port" },
  berlin: { x: 640, y: 150, label: "Berlin DC", sub: "warehouse" },
} as const
type Id = keyof typeof N

const LANES: Array<[Id, Id]> = [["shenzhen", "singapore"], ["singapore", "suez"], ["shenzhen", "colombo"], ["colombo", "suez"], ["suez", "rotterdam"], ["rotterdam", "berlin"]]
const BASELINE: Array<[Id, Id]> = [["shenzhen", "singapore"], ["singapore", "suez"], ["suez", "rotterdam"], ["rotterdam", "berlin"]]
const REROUTE: Array<[Id, Id]> = [["shenzhen", "colombo"], ["colombo", "suez"], ["suez", "rotterdam"], ["rotterdam", "berlin"]]

const path = ([a, b]: [Id, Id]) => {
  const p = N[a], q = N[b]
  const mx = (p.x + q.x) / 2
  return `M ${p.x} ${p.y} C ${mx} ${p.y}, ${mx} ${q.y}, ${q.x} ${q.y}`
}
const key = (l: [Id, Id]) => `${l[0]}-${l[1]}`
const has = (set: Array<[Id, Id]>, l: [Id, Id]) => set.some((x) => x[0] === l[0] && x[1] === l[1])

type Phase = "flow" | "fail" | "reroute" | "decide" | "approved"
const TIMELINE: Array<[Phase, number]> = [["flow", 2000], ["fail", 1200], ["reroute", 1500], ["decide", 2000], ["approved", 1600]]

export function HeroTwin({ className = "" }: { className?: string }) {
  const reduce = useReducedMotion()
  const [phase, setPhase] = useState<Phase>(reduce ? "decide" : "flow")

  useEffect(() => {
    if (reduce) return
    let i = 0
    let t: ReturnType<typeof setTimeout>
    const step = () => {
      setPhase(TIMELINE[i][0])
      t = setTimeout(() => { i = (i + 1) % TIMELINE.length; step() }, TIMELINE[i][1])
    }
    step()
    return () => clearTimeout(t)
  }, [reduce])

  const failed = phase !== "flow"
  const rerouted = phase === "reroute" || phase === "decide" || phase === "approved"
  const showCard = phase === "decide" || phase === "approved"

  return (
    <div className={`relative ${className}`} aria-label="Animated demo: a port fails, the agent reroutes and asks for one decision">
      <svg viewBox="0 0 700 300" className="h-auto w-full" role="img">
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <pattern id="grid" width="28" height="28" patternUnits="userSpaceOnUse"><path d="M 28 0 L 0 0 0 28" fill="none" stroke="#0B0B0F" strokeOpacity="0.05" strokeWidth="1" /></pattern>
        </defs>
        <rect x="0" y="0" width="700" height="300" rx="24" fill="url(#grid)" />

        {/* lanes */}
        {LANES.map((l) => {
          const onBase = has(BASELINE, l), onRe = has(REROUTE, l)
          const dead = failed && (l[0] === "singapore" || l[1] === "singapore")
          const active = rerouted && onRe
          return (
            <g key={key(l)}>
              <path d={path(l)} fill="none" stroke="#0B0B0F" strokeOpacity={dead ? 0.12 : 0.18} strokeWidth={2} />
              {/* cargo flow on the baseline */}
              {!failed && onBase && !reduce && (
                <path d={path(l)} fill="none" stroke="#2748E8" strokeWidth={2.5} strokeDasharray="6 10" strokeLinecap="round" style={{ animation: "heroFlow 1.4s linear infinite" }} />
              )}
              {dead && <path d={path(l)} fill="none" stroke="#B91C1C" strokeWidth={2.5} strokeDasharray="4 6" opacity={0.7} />}
              {/* reroute draws itself */}
              {active && (
                <motion.path d={path(l)} fill="none" stroke="#15803D" strokeWidth={3.5} strokeLinecap="round" filter="url(#glow)"
                  initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 0.6, delay: REROUTE.findIndex((x) => x[0] === l[0] && x[1] === l[1]) * 0.25, ease: "easeOut" }} />
              )}
            </g>
          )
        })}

        {/* nodes */}
        {(Object.keys(N) as Id[]).map((id) => {
          const n = N[id]
          const isFailed = failed && id === "singapore"
          const onRoute = rerouted && REROUTE.some((l) => l[0] === id || l[1] === id)
          const downstream = failed && !rerouted && (id === "suez" || id === "rotterdam" || id === "berlin")
          const stroke = isFailed ? "#B91C1C" : onRoute ? "#15803D" : downstream ? "#B45309" : "#0B0B0F"
          return (
            <g key={id} transform={`translate(${n.x}, ${n.y})`}>
              {isFailed && !reduce && <motion.circle r={18} fill="#B91C1C" initial={{ opacity: 0.5, scale: 0.6 }} animate={{ opacity: 0, scale: 2.2 }} transition={{ duration: 1.1, repeat: Infinity, ease: "easeOut" }} />}
              <circle r={14} fill="#FFFFFF" stroke={stroke} strokeWidth={isFailed || onRoute ? 3 : 2} />
              <circle r={4} fill={stroke} />
              <text y={30} textAnchor="middle" fontSize="12" fontWeight={600} fill="#0B0B0F" fontFamily="Inter, system-ui, sans-serif">{n.label}</text>
              <text y={43} textAnchor="middle" fontSize="9.5" fill="#52525B" fontFamily="Inter, system-ui, sans-serif" letterSpacing="0.06em">{n.sub.toUpperCase()}</text>
            </g>
          )
        })}
      </svg>

      {/* agent status pill */}
      <div className="absolute left-2 top-2 flex items-center gap-2 rounded-full border border-[#E8E8EC] bg-white/90 px-3 py-1 text-[11px] font-semibold text-[#52525B] shadow-sm backdrop-blur">
        <span className={`h-1.5 w-1.5 rounded-full ${failed ? "bg-[#B91C1C]" : "bg-[#15803D]"} ${failed && !reduce ? "animate-pulse" : ""}`} />
        {phase === "flow" && "Sentinel watching · 8 nodes · 11 lanes"}
        {phase === "fail" && "Port of Singapore closed — Analyst grading"}
        {phase === "reroute" && "Routing engine: 3 candidates, exact cost"}
        {(phase === "decide" || phase === "approved") && "Decision ready — you were asked once"}
      </div>

      {/* decision card — reserved slot under the twin so the graph stays visible */}
      <div className="relative mt-2 min-h-[92px]">
        <AnimatePresence mode="wait">
          {showCard ? (
            <motion.div key="card" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col gap-3 rounded-2xl border border-[#E8E8EC] bg-white p-3 shadow-[0_18px_40px_-24px_rgba(11,11,15,0.35)] sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#B45309]"><ShieldAlert className="h-3.5 w-3.5" /> High · 95% · Singapore closed: choose a route</div>
                <div className="mt-1.5 rounded-xl border border-[#2748E8] bg-[#EEF1FF] px-3 py-1.5">
                  <div className="truncate text-[12.5px] font-semibold text-[#0B0B0F]">Shenzhen → Colombo → Suez → Rotterdam → Berlin</div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[#52525B]"><span className="h-1.5 w-1.5 rounded-full bg-[#15803D]" />+$1,000 · +5d · low risk · <span className="font-semibold text-[#15803D]">recommended</span> · vs wait +21d</div>
                </div>
              </div>
              <motion.div className="flex shrink-0 items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-[12px] font-semibold text-white sm:w-[190px]" animate={{ backgroundColor: phase === "approved" ? "#15803D" : "#2748E8" }}>
                <Check className="h-3.5 w-3.5" /> {phase === "approved" ? "Approved · remembered" : "Approve reroute"}
              </motion.div>
            </motion.div>
          ) : (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex h-[92px] items-center justify-center rounded-2xl border border-dashed border-[#E8E8EC] text-[12px] text-[#52525B]">
              {phase === "flow" ? "Nothing needs you. The inbox stays empty." : phase === "fail" ? "Analyst: HIGH · 95% · Shenzhen → Berlin lane severed" : "Routing engine: 3 exact candidates · Router ∥ Impact → Strategist"}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <style>{`@keyframes heroFlow { to { stroke-dashoffset: -32; } }`}</style>
    </div>
  )
}
