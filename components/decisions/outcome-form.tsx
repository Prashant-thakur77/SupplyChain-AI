"use client"

import { useEffect, useState } from "react"
import { ClipboardCheck, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

/** After an approved decision plays out: record what it actually cost and how late it really was. Feeds calibration + accuracy. */
export function OutcomeForm({ decisionId, estimatedCost, estimatedDays }: { decisionId: string; estimatedCost?: number | null; estimatedDays?: number | null }) {
  const [outcome, setOutcome] = useState<any | null | undefined>(undefined), [open, setOpen] = useState(false), [busy, setBusy] = useState(false)
  const [f, setF] = useState({ cost: "", days: "", result: "resolved", notes: "" })
  useEffect(() => { fetch(`/api/decisions/${decisionId}/outcome`).then((r) => r.json()).then((j) => setOutcome(j.outcome ?? null)).catch(() => setOutcome(null)) }, [decisionId])
  if (outcome === undefined) return null
  if (outcome) {
    const dc = outcome.actual_added_cost != null && outcome.estimated_added_cost != null ? outcome.actual_added_cost - outcome.estimated_added_cost : null
    const dd = outcome.actual_added_days != null && outcome.estimated_added_days != null ? outcome.actual_added_days - outcome.estimated_added_days : null
    return <div className="mt-3 rounded-theme-md border border-theme-border-subtle bg-theme-bg-secondary/60 px-3 py-2 text-xs text-theme-text-secondary"><ClipboardCheck className="mr-1 inline h-3.5 w-3.5 text-theme-green" /> Outcome: <span className="font-medium text-theme-text-primary">{outcome.outcome.replace("_", " ")}</span>{outcome.actual_added_cost != null && <> · actual +${Math.round(outcome.actual_added_cost).toLocaleString("en-US")}{dc != null && <span className={dc > 0 ? "text-theme-amber" : "text-theme-green"}> ({dc >= 0 ? "+" : ""}{Math.round(dc).toLocaleString("en-US")} vs estimate)</span>}</>}{outcome.actual_added_days != null && <> · +{outcome.actual_added_days}d{dd != null && <span className={dd > 0 ? "text-theme-amber" : "text-theme-green"}> ({dd >= 0 ? "+" : ""}{dd}d vs estimate)</span>}</>}{outcome.notes && <> · {outcome.notes}</>}</div>
  }
  if (!open) return <button type="button" onClick={() => setOpen(true)} className="mt-3 text-xs font-medium text-theme-blue hover:underline">Record what actually happened →</button>
  const save = async () => {
    setBusy(true)
    try { const r = await fetch(`/api/decisions/${decisionId}/outcome`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ actualAddedCost: f.cost === "" ? null : Number(f.cost), actualAddedDays: f.days === "" ? null : Number(f.days), outcome: f.result, notes: f.notes || null }) }); const j = await r.json(); if (!r.ok) throw new Error(j.error); setOutcome(j.outcome); toast.success("Outcome recorded — the agent will learn from it") } catch (e) { toast.error((e as Error).message) } finally { setBusy(false) }
  }
  return (
    <div className="mt-3 grid gap-2 rounded-theme-md border border-theme-border-subtle bg-theme-bg-secondary/60 p-3 text-xs sm:grid-cols-4">
      <label className="flex flex-col gap-1 text-theme-text-muted">Actual added cost ($){estimatedCost != null && <span className="text-[10px]">est. {Math.round(estimatedCost).toLocaleString("en-US")}</span>}<input type="number" value={f.cost} onChange={(e) => setF({ ...f, cost: e.target.value })} className="rounded border border-theme-border-default bg-theme-bg-surface px-2 py-1 text-theme-text-primary" /></label>
      <label className="flex flex-col gap-1 text-theme-text-muted">Actual added days{estimatedDays != null && <span className="text-[10px]">est. {estimatedDays}</span>}<input type="number" value={f.days} onChange={(e) => setF({ ...f, days: e.target.value })} className="rounded border border-theme-border-default bg-theme-bg-surface px-2 py-1 text-theme-text-primary" /></label>
      <label className="flex flex-col gap-1 text-theme-text-muted">Result<select value={f.result} onChange={(e) => setF({ ...f, result: e.target.value })} className="rounded border border-theme-border-default bg-theme-bg-surface px-2 py-1 text-theme-text-primary"><option value="resolved">Resolved</option><option value="partially_resolved">Partially resolved</option><option value="failed">Did not work</option><option value="not_needed">Wasn't needed</option></select></label>
      <label className="flex flex-col gap-1 text-theme-text-muted">Notes<input value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} className="rounded border border-theme-border-default bg-theme-bg-surface px-2 py-1 text-theme-text-primary" /></label>
      <div className="flex gap-2 sm:col-span-4"><Button size="sm" onClick={save} disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save outcome"}</Button><Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button></div>
    </div>
  )
}
