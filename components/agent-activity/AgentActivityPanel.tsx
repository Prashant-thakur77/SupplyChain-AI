"use client"

import { useMemo, useState } from "react"
import { Bot, ChevronDown, ChevronRight, CircleCheck, CircleX, Loader2, Route, Cpu } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ActivityEvent, StreamStatus } from "./useGraphStream"

const LABELS: Record<string, { title: string; hint: string }> = {
  analyst: { title: "Analyst", hint: "Grades severity, confidence and blast radius" },
  routing_engine: { title: "Routing engine", hint: "Dijkstra · Yen k-best — deterministic, no LLM" },
  graph: { title: "Strands graph", hint: "router ∥ impact → strategist" },
  router: { title: "Router", hint: "Ranks candidate routes" },
  impact: { title: "Impact", hint: "Quantifies revenue at risk and delay" },
  strategist: { title: "Strategist", hint: "Writes the mitigation plan" },
  analysis_graph: { title: "Analysis graph", hint: "intel → forecast ∥ scenario → strategy → report" },
}

interface Step { node: string; startedAt: number; elapsed?: number | null; payload?: Record<string, any> | null; failed?: boolean }

function toSteps(events: ActivityEvent[]): Step[] {
  const steps: Step[] = []
  for (const e of events) {
    if (e.type === "node_start" && e.node) steps.push({ node: e.node, startedAt: e.at })
    else if (e.type === "node_end" && e.node) {
      const s = [...steps].reverse().find((x) => x.node === e.node && x.elapsed === undefined)
      if (s) { s.elapsed = e.elapsed_ms ?? e.at - s.startedAt; s.payload = e.payload ?? null }
    } else if (e.type === "error") {
      const s = [...steps].reverse().find((x) => x.node === e.node && x.elapsed === undefined)
      if (s) { s.failed = true; s.elapsed = e.at - s.startedAt; s.payload = e.payload ?? null }
      else steps.push({ node: e.node ?? "error", startedAt: e.at, elapsed: 0, failed: true, payload: e.payload ?? null })
    }
  }
  return steps
}

export function AgentActivityPanel({ events, status, error, compact = false, className }: { events: ActivityEvent[]; status: StreamStatus; error?: string | null; compact?: boolean; className?: string }) {
  const steps = useMemo(() => toSteps(events), [events])
  const [open, setOpen] = useState<Record<number, boolean>>({})
  const total = steps.reduce((a, s) => a + (s.elapsed ?? 0), 0)

  return (
    <div className={cn("rounded-theme-lg border border-theme-border-subtle bg-theme-bg-surface", className)}>
      <div className="flex items-center gap-2 border-b border-theme-border-subtle px-3 py-2">
        <Bot className="h-4 w-4 text-theme-blue" />
        <span className="text-sm font-semibold text-theme-text-primary">Agent activity</span>
        <span className="ml-auto text-xs text-theme-text-muted">
          {status === "running" && <span className="inline-flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> working…</span>}
          {status === "done" && `${(total / 1000).toFixed(1)}s`}
          {status === "error" && <span className="text-theme-red">failed</span>}
          {status === "idle" && "idle"}
        </span>
      </div>
      <ol className={cn("space-y-1 p-2", compact ? "max-h-56 overflow-y-auto" : "max-h-[60vh] overflow-y-auto")}>
        {steps.length === 0 && status === "idle" && <li className="px-2 py-4 text-center text-xs text-theme-text-muted">Simulate a disruption to watch the incident graph run.</li>}
        {steps.map((s, i) => {
          const running = s.elapsed === undefined
          const meta = LABELS[s.node] ?? { title: s.node, hint: "" }
          const Icon = s.node === "routing_engine" ? Route : s.node.startsWith("graph") ? Cpu : Bot
          const isOpen = !!open[i]
          return (
            <li key={i} className={cn("rounded-theme-md border px-2.5 py-2", s.failed ? "border-theme-red/30 bg-theme-red-soft/40" : running ? "border-theme-blue/30 bg-theme-blue-soft/40" : "border-theme-border-subtle")}>
              <button type="button" className="flex w-full items-center gap-2 text-left" onClick={() => setOpen((o) => ({ ...o, [i]: !o[i] }))}>
                {running ? <Loader2 className="h-4 w-4 animate-spin text-theme-blue" /> : s.failed ? <CircleX className="h-4 w-4 text-theme-red" /> : <CircleCheck className="h-4 w-4 text-theme-green" />}
                <Icon className="h-3.5 w-3.5 text-theme-text-muted" />
                <span className="text-sm font-medium text-theme-text-primary">{meta.title}</span>
                <span className="hidden truncate text-xs text-theme-text-muted sm:inline">{meta.hint}</span>
                <span className="ml-auto font-mono text-[11px] text-theme-text-secondary">{running ? "…" : `${((s.elapsed ?? 0) / 1000).toFixed(1)}s`}</span>
                {s.payload && (isOpen ? <ChevronDown className="h-3.5 w-3.5 text-theme-text-muted" /> : <ChevronRight className="h-3.5 w-3.5 text-theme-text-muted" />)}
              </button>
              {isOpen && s.payload && <pre className="mt-2 max-h-40 overflow-auto rounded bg-theme-bg-secondary p-2 font-mono text-[10px] leading-snug text-theme-text-secondary">{JSON.stringify(s.payload, null, 1)}</pre>}
            </li>
          )
        })}
      </ol>
      {error && <div className="border-t border-theme-border-subtle px-3 py-2 text-xs text-theme-red">{error}</div>}
    </div>
  )
}
