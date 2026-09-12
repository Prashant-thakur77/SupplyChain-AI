"use client"

import { useEffect, useState } from "react"
import { Activity, CheckCircle2, XCircle } from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { supabaseClient } from "@/lib/supabase/client"

interface TraceRow { id: string; agent_name: string; duration_ms: number | null; success: boolean | null; started_at: string; workflow_stage: string | null; input_tokens: number | null; output_tokens: number | null }

const PIPELINE = ["analyst", "routing_engine", "router", "impact", "strategist"]

export function TraceDrawer({ traceId, open, onOpenChange }: { traceId: string | null; open: boolean; onOpenChange: (o: boolean) => void }) {
  const [rows, setRows] = useState<TraceRow[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !traceId) return
    let cancelled = false
    setLoading(true)
    ;(supabaseClient as any).from("agent_traces").select("*").eq("session_id", traceId).order("started_at", { ascending: true })
      .then(({ data }: any) => { if (!cancelled) { setRows(data ?? []); setLoading(false) } })
    return () => { cancelled = true }
  }, [open, traceId])

  const total = rows.reduce((a, r) => a + (r.duration_ms ?? 0), 0)
  const tokens = rows.reduce((a, r) => a + (r.input_tokens ?? 0) + (r.output_tokens ?? 0), 0)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2"><Activity className="h-4 w-4 text-theme-blue" /> Agent execution trace</SheetTitle>
          <SheetDescription>Strands incident graph: analyst → routing engine → router ∥ impact → strategist → decision.</SheetDescription>
        </SheetHeader>
        <div className="mt-4 rounded-theme-md border border-theme-border-subtle bg-theme-bg-secondary p-3 font-mono text-[11px] text-theme-text-secondary">
          {PIPELINE.map((p, i) => (
            <span key={p}>{i > 0 && <span className="text-theme-text-muted"> → </span>}<span className={rows.some((r) => r.agent_name === p) ? "text-theme-text-primary" : ""}>{p}</span></span>
          ))}
        </div>
        <ul className="mt-4 space-y-2">
          {loading && <li className="text-sm text-theme-text-muted">Loading trace…</li>}
          {!loading && rows.length === 0 && <li className="text-sm text-theme-text-muted">No trace rows found for <code>{traceId}</code>. Traces are written by the agent service when Supabase is reachable.</li>}
          {rows.map((r) => (
            <li key={r.id} className="flex items-center gap-3 rounded-theme-md border border-theme-border-subtle bg-theme-bg-surface px-3 py-2">
              {r.success === false ? <XCircle className="h-4 w-4 text-theme-red" /> : <CheckCircle2 className="h-4 w-4 text-theme-green" />}
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-theme-text-primary">{r.agent_name}</div>
                <div className="text-xs text-theme-text-muted">{new Date(r.started_at).toLocaleTimeString()} · {r.workflow_stage ?? "—"}{r.input_tokens != null ? ` · ${(r.input_tokens ?? 0) + (r.output_tokens ?? 0)} tok` : ""}</div>
              </div>
              <div className="font-mono text-xs text-theme-text-secondary">{r.duration_ms != null ? `${(r.duration_ms / 1000).toFixed(1)}s` : "—"}</div>
            </li>
          ))}
        </ul>
        {rows.length > 0 && (
          <div className="mt-4 flex items-center justify-between border-t border-theme-border-subtle pt-3 text-xs text-theme-text-secondary">
            <span>{rows.length} agent runs</span><span>{(total / 1000).toFixed(1)}s total{tokens ? ` · ${tokens.toLocaleString()} tokens` : ""}</span>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
