"use client"

import { useEffect, useState } from "react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

type S = { ok: boolean; provider?: string; model?: string; latency_ms?: number; error?: string } | null

/** Small header indicator: green = agent service healthy, amber = unreachable. Polls /api/agent/status every 60s. */
export function AgentHealthDot() {
  const [s, setS] = useState<S>(null)
  useEffect(() => {
    let alive = true
    const tick = () => fetch("/api/agent/status", { cache: "no-store" }).then((r) => r.json()).then((j) => alive && setS(j.service)).catch(() => alive && setS({ ok: false, error: "unreachable" }))
    tick()
    const t = setInterval(tick, 60_000)
    return () => { alive = false; clearInterval(t) }
  }, [])
  if (!s) return null
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span aria-label={s.ok ? "Agent service healthy" : "Agent service unreachable"} className="inline-flex h-9 items-center gap-1.5 rounded-full px-2 text-xs text-theme-text-secondary">
            <span className={cn("inline-block h-2 w-2 rounded-full", s.ok ? "bg-theme-green" : "bg-theme-amber animate-pulse")} />
            <span className="hidden sm:inline">Agent</span>
          </span>
        </TooltipTrigger>
        <TooltipContent>{s.ok ? `Strands agent-service · ${s.provider} · ${s.model} · ${s.latency_ms} ms` : `Agent service unreachable: ${s.error ?? "no response"}`}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
