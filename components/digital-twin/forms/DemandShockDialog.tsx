"use client"

import { useState } from "react"
import { Loader2, TrendingUp } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useDigitalTwinStore } from "@/lib/digitalTwinStore"
import { cn } from "@/lib/utils"

/** "What if demand jumps 40% in Berlin for 6 weeks?" — coupled to flows: capacity saturation, cost to serve, stock-out timing. */
export function DemandShockDialog({ isOpen, onClose, supplyChainId, userId }: { isOpen: boolean; onClose: () => void; supplyChainId: string; userId: string }) {
  const nodes = useDigitalTwinStore((s) => s.nodes).filter((n) => n.type !== "group")
  const [pct, setPct] = useState(40), [weeks, setWeeks] = useState(4), [dest, setDest] = useState<string>(""), [busy, setBusy] = useState(false), [rep, setRep] = useState<any | null>(null)
  const run = async () => {
    setBusy(true)
    try { const r = await fetch("/api/agent/demand-shock", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ supplyChainId, userId, multiplier: 1 + pct / 100, durationWeeks: weeks, destinationIds: dest ? [dest] : [] }) }); const j = await r.json(); if (!r.ok) throw new Error(j.detail ?? j.error); setRep(j); if (!j.lanes?.length) toast.message("No flows in scope — add flows (value at risk) first") } catch (e) { toast.error((e as Error).message) } finally { setBusy(false) }
  }
  const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`
  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-theme-blue" /> Demand shock</DialogTitle><DialogDescription>Scale demand on your flows and see which lanes saturate, what the extra volume costs, and how fast stock runs out. Pure math on the twin — no model.</DialogDescription></DialogHeader>
        <div className="grid gap-3 rounded-theme-md border border-theme-border-subtle p-3 sm:grid-cols-[1fr_120px_1fr_auto] sm:items-end">
          <label className="text-xs text-theme-text-secondary">Demand change ({pct >= 0 ? "+" : ""}{pct}%)<input type="range" min={-50} max={200} step={5} value={pct} onChange={(e) => setPct(Number(e.target.value))} className="mt-2 w-full accent-[#4F46E5]" /></label>
          <label className="text-xs text-theme-text-secondary">Weeks<input type="number" min={1} max={52} value={weeks} onChange={(e) => setWeeks(Number(e.target.value))} className="mt-1 w-full rounded-theme-md border border-theme-border-default bg-theme-bg-secondary px-2 py-1.5 text-sm text-theme-text-primary" /></label>
          <label className="text-xs text-theme-text-secondary">Where<select value={dest} onChange={(e) => setDest(e.target.value)} className="mt-1 w-full rounded-theme-md border border-theme-border-default bg-theme-bg-secondary px-2 py-1.5 text-sm text-theme-text-primary"><option value="">All destinations</option>{nodes.map((n) => <option key={n.id} value={n.id}>{String(n.data?.label ?? n.id)}</option>)}</select></label>
          <Button size="sm" onClick={run} disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Simulate"}</Button>
        </div>
        {rep && (
          <div className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="rounded-theme-md border border-theme-amber/30 bg-theme-amber-soft p-3"><div className="text-xl font-bold text-theme-amber">{usd(rep.extra_cost_total)}<span className="text-xs font-normal">/wk</span></div><div className="text-xs text-theme-text-secondary">Cost to serve the extra volume</div></div>
              <div className={cn("rounded-theme-md border p-3", rep.lost_value_total > 0 ? "border-theme-red/30 bg-theme-red-soft" : "border-theme-green/30 bg-theme-green-soft")}><div className={cn("text-xl font-bold", rep.lost_value_total > 0 ? "text-theme-red" : "text-theme-green")}>{usd(rep.lost_value_total)}<span className="text-xs font-normal">/wk</span></div><div className="text-xs text-theme-text-secondary">Demand that cannot be served (capacity)</div></div>
              <div className="rounded-theme-md border border-theme-blue/30 bg-theme-blue-soft p-3"><div className="text-xl font-bold text-theme-blue">{rep.first_stockout_days != null ? `${Math.round(rep.first_stockout_days)}d` : "—"}</div><div className="text-xs text-theme-text-secondary">Days of cover at the tightest site</div></div>
            </div>
            <ul className="space-y-1 text-sm text-theme-text-secondary">{rep.summary.map((s: string, i: number) => <li key={i}>• {s}</li>)}</ul>
            <div className="overflow-x-auto rounded-theme-md border border-theme-border-subtle"><table className="w-full text-xs"><thead className="bg-theme-bg-secondary text-[10px] uppercase tracking-wide text-theme-text-muted"><tr>{["Flow", "Units/wk", "Extra cost/wk", "Cover", "Saturated lanes", "Unserved"].map((h) => <th key={h} className="px-2 py-1.5 text-left">{h}</th>)}</tr></thead>
              <tbody>{rep.lanes.map((l: any, i: number) => <tr key={i} className="border-t border-theme-border-subtle"><td className="px-2 py-1.5 text-theme-text-primary">{l.label}{l.product ? <span className="text-theme-text-muted"> · {l.product}</span> : null}</td><td className="px-2 py-1.5 font-mono">{l.base_units} → {l.new_units}</td><td className="px-2 py-1.5 font-mono">{usd(l.extra_cost_per_week)}</td><td className="px-2 py-1.5 font-mono">{l.days_of_cover_before ?? "—"} → {l.days_of_cover_after ?? "—"}d</td><td className={cn("px-2 py-1.5", l.saturated_lanes.length && "text-theme-red")}>{l.saturated_lanes.join(", ") || "—"}</td><td className={cn("px-2 py-1.5 font-mono", l.lost_value_per_week > 0 && "text-theme-red")}>{l.shortfall_units ? `${l.shortfall_units} u · ${usd(l.lost_value_per_week)}` : "—"}</td></tr>)}</tbody></table></div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
