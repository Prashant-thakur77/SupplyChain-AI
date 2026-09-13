"use client"

import { useEffect, useState } from "react"
import { Activity, Bot, Coins, Download, RefreshCw, TimerReset, XCircle } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { getUserData } from "@/utils/functions/userUtils"
import { cn } from "@/lib/utils"

interface Ops { days: number; runs: number; sessions: number; fails: number; tokens: number; est_cost_usd: number; agents: { name: string; runs: number; avg_ms: number; p95_ms: number; fail: number; tokens: number }[]; stages: { stage: string; runs: number; avg_ms: number }[]; by_day: { day: string; runs: number }[]; recent: any[] }

const STAGE_HINT: Record<string, string> = { incident: "incident graph", scan: "Sentinel background scan", chat: "copilot", analysis: "analysis graph", simulation: "simulation report", twin_draft: "text-to-twin", forecast_report: "forecast", strategy_report: "strategy", live_intel: "live intel", suggestions: "builder suggestions" }

export function AgentOps() {
  const [uid, setUid] = useState<string | null>(null)
  const [days, setDays] = useState(7)
  const [ops, setOps] = useState<Ops | null>(null)
  const [loading, setLoading] = useState(false)
  useEffect(() => { getUserData().then((u) => setUid(u?.id ?? null)).catch(() => setUid(null)) }, [])
  const load = async () => { if (!uid) return; setLoading(true); try { setOps(await fetch(`/api/agents/ops?userId=${uid}&days=${days}`, { cache: "no-store" }).then((r) => r.json())) } finally { setLoading(false) } }
  useEffect(() => { load() }, [uid, days]) // eslint-disable-line react-hooks/exhaustive-deps
  const max = Math.max(1, ...(ops?.by_day.map((d) => d.runs) ?? [1]))

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader eyebrow="Observability" title="Agent Ops" subtitle="Every Strands agent run is traced by hooks: duration, tokens, success. This is what the agent has been doing on your behalf, and what it costs." icon={<Activity className="h-5 w-5" />}
        actions={<div className="flex items-center gap-2">
          <div className="flex rounded-theme-md border border-theme-border-subtle bg-theme-bg-secondary p-0.5 text-xs">{[1, 7, 30].map((d) => <button key={d} type="button" onClick={() => setDays(d)} className={cn("rounded-theme-sm px-2.5 py-1 font-medium", days === d ? "bg-theme-bg-surface text-theme-text-primary shadow-sm" : "text-theme-text-secondary")}>{d}d</button>)}</div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-1.5"><RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} /> Refresh</Button>
        </div>} />
      {!ops ? <div className="mt-6 grid gap-3 sm:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-theme-lg" />)}</div> : (
        <>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {[["Agent runs", ops.runs, Bot], ["Sessions", ops.sessions, Activity], ["Failures", ops.fails, XCircle], ["Tokens", ops.tokens.toLocaleString(), TimerReset], ["Est. model cost", `$${ops.est_cost_usd.toFixed(2)}`, Coins]].map(([l, v, I]: any) => (
              <div key={l} className="rounded-theme-lg border border-theme-border-subtle bg-theme-bg-surface p-4"><div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-theme-text-muted"><I className="h-3.5 w-3.5" /> {l}</div><div className="mt-1 font-display text-2xl font-semibold text-theme-text-primary">{v}</div></div>
            ))}
          </div>
          <div className="mt-4 rounded-theme-lg border border-theme-border-subtle bg-theme-bg-surface p-4">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-theme-text-muted">Runs per day</div>
            <div className="mt-3 flex h-24 items-end gap-1">{ops.by_day.length === 0 && <span className="text-xs text-theme-text-muted">No runs in this window.</span>}{ops.by_day.map((d) => <div key={d.day} title={`${d.day}: ${d.runs}`} className="flex-1 rounded-t bg-theme-blue opacity-80" style={{ height: `${(d.runs / max) * 100}%` }} />)}</div>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
            <div className="overflow-x-auto rounded-theme-lg border border-theme-border-subtle bg-theme-bg-surface">
              <table className="w-full text-sm"><thead className="bg-theme-bg-secondary text-[11px] uppercase tracking-wide text-theme-text-muted"><tr><th className="px-3 py-2 text-left">Agent</th><th className="px-3 py-2 text-right">Runs</th><th className="px-3 py-2 text-right">Avg</th><th className="px-3 py-2 text-right">p95</th><th className="px-3 py-2 text-right">Fail</th><th className="px-3 py-2 text-right">Tokens</th></tr></thead>
                <tbody>{ops.agents.map((a) => <tr key={a.name} className="border-t border-theme-border-subtle"><td className="px-3 py-2 font-medium text-theme-text-primary">{a.name}</td><td className="px-3 py-2 text-right">{a.runs}</td><td className="px-3 py-2 text-right font-mono text-xs">{(a.avg_ms / 1000).toFixed(1)}s</td><td className="px-3 py-2 text-right font-mono text-xs">{(a.p95_ms / 1000).toFixed(1)}s</td><td className={cn("px-3 py-2 text-right", a.fail && "text-theme-red")}>{a.fail}</td><td className="px-3 py-2 text-right font-mono text-xs">{a.tokens.toLocaleString()}</td></tr>)}</tbody></table>
            </div>
            <div className="rounded-theme-lg border border-theme-border-subtle bg-theme-bg-surface p-4">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-theme-text-muted">By workflow</div>
              <ul className="mt-2 space-y-1.5">{ops.stages.map((s) => <li key={s.stage} className="flex items-center justify-between text-sm"><span className="text-theme-text-primary">{STAGE_HINT[s.stage] ?? s.stage}</span><span className="text-xs text-theme-text-secondary">{s.runs} runs · {(s.avg_ms / 1000).toFixed(1)}s avg</span></li>)}</ul>
              <div className="mt-4 border-t border-theme-border-subtle pt-3 text-[11px] font-semibold uppercase tracking-wide text-theme-text-muted">Export</div>
              <div className="mt-2 flex flex-wrap gap-2">{["decisions", "audit", "traces", "alerts"].map((w) => <a key={w} href={`/api/export?userId=${uid}&what=${w}`} className="inline-flex items-center gap-1.5 rounded-full border border-theme-border-subtle px-3 py-1 text-xs text-theme-text-secondary hover:border-theme-blue hover:text-theme-blue"><Download className="h-3 w-3" /> {w}.csv</a>)}</div>
            </div>
          </div>
          <div className="mt-4 overflow-x-auto rounded-theme-lg border border-theme-border-subtle bg-theme-bg-surface">
            <table className="w-full text-sm"><thead className="bg-theme-bg-secondary text-[11px] uppercase tracking-wide text-theme-text-muted"><tr><th className="px-3 py-2 text-left">When</th><th className="px-3 py-2 text-left">Agent</th><th className="px-3 py-2 text-left">Workflow</th><th className="px-3 py-2 text-right">Duration</th><th className="px-3 py-2 text-right">Tokens</th><th className="px-3 py-2 text-left">Session</th></tr></thead>
              <tbody>{ops.recent.map((r, i) => <tr key={i} className="border-t border-theme-border-subtle"><td className="px-3 py-1.5 text-xs text-theme-text-secondary">{new Date(r.started_at).toLocaleString()}</td><td className="px-3 py-1.5 font-medium text-theme-text-primary">{r.agent_name}</td><td className="px-3 py-1.5 text-xs">{STAGE_HINT[r.workflow_stage] ?? r.workflow_stage}</td><td className="px-3 py-1.5 text-right font-mono text-xs">{((r.duration_ms ?? 0) / 1000).toFixed(1)}s</td><td className="px-3 py-1.5 text-right font-mono text-xs">{(r.input_tokens ?? 0) + (r.output_tokens ?? 0) || "—"}</td><td className="px-3 py-1.5 font-mono text-[10px] text-theme-text-muted">{r.session_id}</td></tr>)}</tbody></table>
          </div>
        </>
      )}
    </div>
  )
}
