"use client"

import { useState } from "react"
import { Loader2, Plus, Swords, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useDigitalTwinStore } from "@/lib/digitalTwinStore"
import { cn } from "@/lib/utils"
import type { IncidentEvent } from "@/types/agent"

interface Row { name: string; failed: string[]; severity: string; lanes_affected: number; lanes_cut: number; best_added_cost: number; best_added_days: number; reroute_cost_over_duration: number; value_at_risk_usd: number; downstream_nodes: number; p_network_failure: number; recommended: string }
interface Custom { name: string; failed_node_ids: string[]; duration_days: number }

/** Compare what-ifs side by side: presets (per country, busiest ports, most fragile pair) plus your own. */
export function WarRoomDialog({ endpoint, onFail, className }: { endpoint: string; onFail?: (e: IncidentEvent) => void; className?: string }) {
  const nodes = useDigitalTwinStore((s) => s.nodes).filter((n) => n.type !== "group")
  const [open, setOpen] = useState(false), [busy, setBusy] = useState(false), [rows, setRows] = useState<Row[] | null>(null), [hasFlows, setHasFlows] = useState(true)
  const [custom, setCustom] = useState<Custom[]>([])
  const run = async () => {
    setBusy(true)
    try { const st = useDigitalTwinStore.getState(); const r = await fetch(endpoint, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ supplyChainId: st.selectedSupplyChain, nodes: st.nodes, edges: st.edges, scenarios: custom, usePresets: true }) }); const j = await r.json(); if (!r.ok) throw new Error(j.detail ?? j.error); setRows(j.scenarios); setHasFlows(!!j.has_flows) } catch (e) { setRows([]); console.error(e) } finally { setBusy(false) }
  }
  const money = (n: number) => `$${Math.round(n).toLocaleString()}`
  const sev = (s: string) => s === "CRITICAL" ? "text-theme-red" : s === "HIGH" ? "text-theme-amber" : s === "MEDIUM" ? "text-theme-blue" : "text-theme-green"
  return (
    <>
      <button type="button" onClick={() => { setOpen(true); if (!rows) run() }} className={cn("inline-flex w-full items-center justify-center gap-2 rounded-theme-md border border-theme-border-subtle bg-theme-bg-surface px-3 py-2 text-sm font-medium text-theme-text-primary hover:border-theme-blue hover:text-theme-blue", className)}><Swords className="h-4 w-4" /> War room · compare what-ifs</button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Swords className="h-5 w-5 text-theme-blue" /> War room</DialogTitle><DialogDescription>Deterministic comparison of scenarios: lanes affected, bypass cost, value at risk over the duration, cascade probability, and a recommendation. Add your own combinations below.</DialogDescription></DialogHeader>
          <div className="rounded-theme-md border border-theme-border-subtle p-3">
            <div className="flex items-center justify-between"><span className="text-[11px] font-semibold uppercase tracking-wide text-theme-text-muted">Custom scenarios</span><Button size="sm" variant="outline" className="gap-1" onClick={() => setCustom((c) => [...c, { name: `Scenario ${c.length + 1}`, failed_node_ids: [nodes[0]?.id].filter(Boolean) as string[], duration_days: 14 }])}><Plus className="h-3.5 w-3.5" /> Add</Button></div>
            {custom.map((c, i) => (
              <div key={i} className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <input value={c.name} onChange={(e) => setCustom((x) => x.map((y, j) => (j === i ? { ...y, name: e.target.value } : y)))} className="w-32 rounded border border-theme-border-subtle bg-theme-bg-secondary px-2 py-1" />
                <select multiple value={c.failed_node_ids} onChange={(e) => setCustom((x) => x.map((y, j) => (j === i ? { ...y, failed_node_ids: Array.from(e.target.selectedOptions).map((o) => o.value) } : y)))} className="h-16 min-w-[200px] rounded border border-theme-border-subtle bg-theme-bg-secondary px-2 py-1">{nodes.map((n) => <option key={n.id} value={n.id}>{n.data?.label ?? n.id}</option>)}</select>
                <label className="flex items-center gap-1">for <input type="number" value={c.duration_days} onChange={(e) => setCustom((x) => x.map((y, j) => (j === i ? { ...y, duration_days: Number(e.target.value) } : y)))} className="w-14 rounded border border-theme-border-subtle bg-theme-bg-secondary px-1 py-1" /> days</label>
                <button type="button" onClick={() => setCustom((x) => x.filter((_, j) => j !== i))} className="text-theme-text-muted hover:text-theme-red"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>))}
            <div className="mt-2 flex justify-end"><Button size="sm" onClick={run} disabled={busy} className="gap-1.5">{busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Compare</Button></div>
          </div>
          {rows && (
            <div className="overflow-x-auto rounded-theme-md border border-theme-border-subtle">
              <table className="w-full text-xs"><thead className="bg-theme-bg-secondary text-[10px] uppercase tracking-wide text-theme-text-muted"><tr>{["Scenario", "Severity", "Lanes", "Cut", "Best bypass", "Reroute cost", "Value at risk", "Cascade p", "Recommendation", ""].map((h) => <th key={h} className="px-2 py-1.5 text-left">{h}</th>)}</tr></thead>
                <tbody>{rows.map((r) => (
                  <tr key={r.name} className="border-t border-theme-border-subtle align-top">
                    <td className="px-2 py-1.5"><div className="font-medium text-theme-text-primary">{r.name}</div><div className="text-[10px] text-theme-text-muted">{r.failed.join(", ")}</div></td>
                    <td className={cn("px-2 py-1.5 font-semibold", sev(r.severity))}>{r.severity}</td><td className="px-2 py-1.5">{r.lanes_affected}</td><td className={cn("px-2 py-1.5", r.lanes_cut && "font-semibold text-theme-red")}>{r.lanes_cut}</td>
                    <td className="px-2 py-1.5 font-mono">{r.lanes_affected - r.lanes_cut > 0 ? `+${money(r.best_added_cost)} · +${Math.round(r.best_added_days)}d` : "—"}</td><td className="px-2 py-1.5 font-mono">{money(r.reroute_cost_over_duration)}</td><td className="px-2 py-1.5 font-mono">{hasFlows ? money(r.value_at_risk_usd) : "add flows"}</td><td className="px-2 py-1.5 font-mono">{Math.round(r.p_network_failure * 100)}%</td>
                    <td className="max-w-[260px] px-2 py-1.5 text-theme-text-secondary">{r.recommended}</td>
                    <td className="px-2 py-1.5">{onFail && r.lanes_affected > 0 && <button type="button" onClick={() => { setOpen(false); onFail({ id: `war-${Date.now()}`, kind: "simulation", title: `${r.name}: what-if from the war room`, description: `Scenario: ${r.failed.join(", ")} unavailable.`, failed_node_ids: nodes.filter((n) => r.failed.includes(n.data?.label ?? n.id)).map((n) => n.id), failed_edge_ids: [], sources: [] }) }} className="rounded-full border border-theme-border-subtle px-2 py-0.5 text-[10px] font-semibold text-theme-text-secondary hover:border-theme-red hover:text-theme-red">Run</button>}</td>
                  </tr>))}</tbody></table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
