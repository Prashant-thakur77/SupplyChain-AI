"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { Bot, Inbox, Radar, ShieldAlert, Cpu } from "lucide-react"
import { getUserData } from "@/utils/functions/userUtils"
import { cn } from "@/lib/utils"

interface Status { service: { ok: boolean; provider?: string; model?: string; latency_ms?: number; error?: string }; twins: { id: string; name: string; last_scan: string | null }[]; pending_decisions: number; alerts_24h: number; db_error?: string }

/** "What is the agent doing?" — one card on the dashboard. */
export function AgentStatusCard({ className }: { className?: string }) {
  const [st, setSt] = useState<Status | null>(null)
  useEffect(() => {
    let alive = true
    const load = async () => {
      const u = await getUserData().catch(() => null)
      const r = await fetch(`/api/agent/status${u?.id ? `?userId=${u.id}` : ""}`, { cache: "no-store" }).then((r) => r.json()).catch(() => null)
      if (alive && r) setSt(r)
    }
    load()
    const t = setInterval(load, 60_000)
    return () => { alive = false; clearInterval(t) }
  }, [])
  const ok = st?.service.ok
  return (
    <div data-tour="agent-status" className={cn("rounded-theme-lg border border-theme-border-subtle bg-theme-bg-surface p-4", className)}>
      <div className="flex items-center gap-2">
        <Bot className="h-4 w-4 text-theme-blue" />
        <h3 className="text-sm font-semibold text-theme-text-primary">Agent status</h3>
        <span className={cn("ml-auto inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold", ok ? "border-theme-green/30 bg-theme-green-soft text-theme-green" : st ? "border-theme-amber/30 bg-theme-amber-soft text-theme-amber" : "border-theme-border-subtle text-theme-text-muted")}>
          <span className={cn("h-1.5 w-1.5 rounded-full", ok ? "bg-theme-green" : "bg-theme-amber")} />{!st ? "checking…" : ok ? "watching" : "offline"}
        </span>
      </div>
      {st && (
        <>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <Link href="/decisions" className="rounded-theme-md border border-theme-border-subtle bg-theme-bg-secondary p-2 hover:border-theme-blue"><div className="text-xl font-bold text-theme-text-primary">{st.pending_decisions}</div><div className="flex items-center justify-center gap-1 text-[10px] uppercase tracking-wide text-theme-text-muted"><Inbox className="h-3 w-3" /> decisions</div></Link>
            <div className="rounded-theme-md border border-theme-border-subtle bg-theme-bg-secondary p-2"><div className="text-xl font-bold text-theme-text-primary">{st.alerts_24h}</div><div className="flex items-center justify-center gap-1 text-[10px] uppercase tracking-wide text-theme-text-muted"><ShieldAlert className="h-3 w-3" /> alerts 24h</div></div>
            <div className="rounded-theme-md border border-theme-border-subtle bg-theme-bg-secondary p-2"><div className="text-xl font-bold text-theme-text-primary">{st.twins.length}</div><div className="flex items-center justify-center gap-1 text-[10px] uppercase tracking-wide text-theme-text-muted"><Radar className="h-3 w-3" /> twins watched</div></div>
          </div>
          <ul className="mt-3 space-y-1">
            {st.twins.slice(0, 4).map((t) => (
              <li key={t.id} className="flex items-center justify-between text-xs"><span className="truncate text-theme-text-secondary">{t.name}</span><span className="shrink-0 text-theme-text-muted">{t.last_scan ? `scanned ${formatDistanceToNow(new Date(t.last_scan), { addSuffix: true })}` : "not scanned yet"}</span></li>
            ))}
            {st.twins.length === 0 && <li className="text-xs text-theme-text-muted">No twins yet — build one or import a CSV in Digital Twin.</li>}
          </ul>
          <div className="mt-3 flex items-center gap-1.5 border-t border-theme-border-subtle pt-2 text-[11px] text-theme-text-muted"><Cpu className="h-3 w-3" />{ok ? `Strands · ${st.service.provider} · ${st.service.model} · ${st.service.latency_ms} ms` : `Agent service unreachable — ${st.service.error ?? "no response"}. Scans and decisions are paused.`}</div>
        </>
      )}
    </div>
  )
}
