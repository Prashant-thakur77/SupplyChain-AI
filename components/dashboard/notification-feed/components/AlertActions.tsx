"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Check, CircleDot, CircleCheckBig, UserPlus, Loader2, Bot, Inbox, ExternalLink } from "lucide-react"
import { useUser } from "@/lib/stores/user"
import { getLatestAlertAction, recordAlertAction, alertStatusLabel, DEFAULT_ALERT_STATE, type AlertActionState, type AlertStatus } from "@/lib/alert-actions"
import { AgentActivityPanel } from "@/components/agent-activity/AgentActivityPanel"
import { useGraphStream } from "@/components/agent-activity/useGraphStream"
import type { IncidentResult } from "@/types/agent"

const STATUS_STEPS: { value: Exclude<AlertStatus, "open" | "reopened">; label: string; icon: typeof CircleDot }[] = [
  { value: "acknowledged", label: "Acknowledge", icon: Check },
  { value: "in_progress", label: "In progress", icon: CircleDot },
  { value: "resolved", label: "Resolve", icon: CircleCheckBig },
]

const STATUS_BADGE: Record<AlertStatus, string> = {
  open: "border-border bg-muted text-muted-foreground",
  acknowledged: "border-theme-blue/30 bg-theme-blue-soft text-theme-blue",
  in_progress: "border-theme-amber/30 bg-theme-amber-soft text-theme-amber",
  resolved: "border-theme-green/30 bg-theme-green-soft text-theme-green",
  reopened: "border-theme-amber/30 bg-theme-amber-soft text-theme-amber",
}

export interface AlertContext {
  title?: string | null
  message?: string | null
  severity?: string | null
  node?: string | null
  nodeId?: string | null
  nodeIds?: string[] | null
  supplyChainId?: string | null
  sources?: { title: string; url: string; credibility?: number }[] | null
}

/** Close the loop on an alert: acknowledge → assign → resolve, and hand it to the Strands incident graph for a decision. */
export function AlertActions({ notificationId, alert }: { notificationId: string; alert?: AlertContext }) {
  const { userData } = useUser()
  const [state, setState] = useState<AlertActionState>(DEFAULT_ALERT_STATE)
  const [note, setNote] = useState("")
  const [assignee, setAssignee] = useState("")
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const stream = useGraphStream()
  const [result, setResult] = useState<IncidentResult | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setResult(null)
    stream.reset()
    getLatestAlertAction(notificationId).then((s) => {
      if (cancelled) return
      setState(s); setNote(s.note ?? ""); setAssignee(s.assignee ?? ""); setLoading(false)
    })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notificationId])

  async function transition(status: Exclude<AlertStatus, "open">) {
    if (!userData?.id) { toast.error("Sign in to act on alerts."); return }
    setBusy(status)
    const res = await recordAlertAction({ notificationId, userId: userData.id, status, assignee: assignee || null, note: note || null })
    setBusy(null)
    if (!res.ok) { toast.error(res.error ?? "Could not update the alert."); return }
    setState({ status, assignee: assignee || null, note: note || null, updatedAt: new Date().toISOString() })
    toast.success(`Alert ${alertStatusLabel(status).toLowerCase()}`)
  }

  async function runIncident() {
    const failed = alert?.nodeIds?.length ? alert.nodeIds : alert?.nodeId ? [alert.nodeId] : []
    if (!alert?.supplyChainId || !failed.length) { toast.error("This alert isn't linked to a supply chain node, so the incident graph can't route around it."); return }
    setResult(null)
    const r = await stream.start<IncidentResult>("/api/agent/incident", {
      supplyChainId: alert.supplyChainId, userId: userData?.id, persist: true,
      event: { id: `alert-${notificationId}`, kind: "news", title: alert.title ?? "Alert", description: alert.message ?? "", failed_node_ids: failed, failed_edge_ids: [], sources: alert.sources ?? [] },
    })
    if (r?.assessment) {
      setResult(r)
      if (r.status === "decision") toast.success("Decision created — open your inbox to approve a route.")
      else toast.info(`Assessed as ${r.assessment.severity}; logged, no decision needed.`)
      if (state.status === "open") transition("acknowledged").catch(() => undefined)
    }
  }

  const rec = result?.decision?.options.find((o) => o.id === result.decision?.recommended_option_id)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUS_BADGE[state.status]}`}>{alertStatusLabel(state.status)}</span>
        {state.assignee && <span className="text-xs text-muted-foreground">Owner: {state.assignee}</span>}
        {state.updatedAt && <span className="text-xs text-muted-foreground">· {new Date(state.updatedAt).toLocaleString()}</span>}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <label className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <UserPlus className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <input value={assignee} onChange={(e) => setAssignee(e.target.value)} placeholder="Assign to (name or team)" className="w-full bg-transparent text-sm outline-none" />
        </label>
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note" className="rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none" />
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_STEPS.map(({ value, label, icon: Icon }) => (
          <button key={value} type="button" disabled={loading || !!busy || state.status === value} onClick={() => transition(value)}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-accent disabled:opacity-50">
            {busy === value ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <Icon className="h-3.5 w-3.5" aria-hidden="true" />}{label}
          </button>
        ))}
        {state.status === "resolved" && (
          <button type="button" disabled={!!busy} onClick={() => transition("reopened")} className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-accent">Reopen</button>
        )}
      </div>

      <div className="border-t border-border pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-sm font-medium text-foreground">Incident response</div>
            <div className="text-xs text-muted-foreground">Grade it, compute exact reroutes, draft the mitigation, and create a decision.</div>
          </div>
          <button type="button" disabled={stream.status === "running"} onClick={runIncident}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60">
            {stream.status === "running" ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <Bot className="h-3.5 w-3.5" aria-hidden="true" />}
            {stream.status === "running" ? "Running…" : result ? "Run again" : "Run incident graph"}
          </button>
        </div>
        {stream.status !== "idle" && <AgentActivityPanel events={stream.events} status={stream.status} error={stream.error} compact className="mt-3" />}
        {result && (
          <div className="mt-3 rounded-lg border border-border bg-card p-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-foreground">{result.assessment.severity}</span>
              <span className="text-xs text-muted-foreground">confidence {Math.round(result.assessment.confidence * 100)}%</span>
              {result.plan && <span className="text-xs text-muted-foreground">· {result.plan.feasible_count} lane{result.plan.feasible_count === 1 ? "" : "s"} reroutable</span>}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{result.assessment.summary}</p>
            {rec && <p className="mt-2 text-sm text-foreground">Recommended: <strong>{rec.label}</strong> <span className="text-muted-foreground">({rec.added_cost ? `+$${Math.round(rec.added_cost).toLocaleString()}` : "no added cost"}{rec.added_days ? `, +${Math.round(rec.added_days)}d` : ""})</span></p>}
            {result.decision_id && (
              <Link href="/decisions" className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-theme-blue hover:underline"><Inbox className="h-3.5 w-3.5" /> Open in Decision Inbox <ExternalLink className="h-3 w-3" /></Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
