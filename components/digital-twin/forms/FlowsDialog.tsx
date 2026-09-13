"use client"

import { useEffect, useState } from "react"
import { Loader2, Plus, Save, Trash2, Truck } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useDigitalTwinStore } from "@/lib/digitalTwinStore"

interface FlowRow { origin_node_id: string; destination_node_id: string; product: string; units_per_week: number; value_per_unit: number; lead_time_days: number | null; penalty_per_day: number; inventory_days: number }

/** What moves on the network: origin → destination, units/week, value/unit, penalties, days of cover. Makes impact value-weighted. */
export function FlowsDialog({ isOpen, onClose, supplyChainId, userId }: { isOpen: boolean; onClose: () => void; supplyChainId: string; userId: string }) {
  const nodes = useDigitalTwinStore((s) => s.nodes).filter((n) => n.type !== "group")
  const [rows, setRows] = useState<FlowRow[]>([])
  const [busy, setBusy] = useState(false)
  useEffect(() => { if (isOpen) fetch(`/api/flows?supplyChainId=${supplyChainId}`).then((r) => r.json()).then((j) => setRows((j.flows ?? []).map((f: any) => ({ origin_node_id: f.origin_node_id, destination_node_id: f.destination_node_id, product: f.product ?? "", units_per_week: Number(f.units_per_week), value_per_unit: Number(f.value_per_unit), lead_time_days: f.lead_time_days, penalty_per_day: Number(f.penalty_per_day ?? 0), inventory_days: Number(f.inventory_days ?? 0) })))).catch(() => setRows([])) }, [isOpen, supplyChainId])
  const sources = nodes.filter((n) => !useDigitalTwinStore.getState().edges.some((e) => e.target === n.id)), sinks = nodes.filter((n) => !useDigitalTwinStore.getState().edges.some((e) => e.source === n.id))
  const add = () => setRows((r) => [...r, { origin_node_id: sources[0]?.id ?? nodes[0]?.id ?? "", destination_node_id: sinks[0]?.id ?? nodes[nodes.length - 1]?.id ?? "", product: "", units_per_week: 100, value_per_unit: 50, lead_time_days: null, penalty_per_day: 0, inventory_days: 7 }])
  const upd = (i: number, k: keyof FlowRow, v: any) => setRows((r) => r.map((x, j) => (j === i ? { ...x, [k]: v } : x)))
  const save = async () => { setBusy(true); try { const res = await fetch("/api/flows", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ userId, supplyChainId, flows: rows }) }); const j = await res.json(); if (!res.ok) throw new Error(j.error); toast.success(`${rows.length} flow${rows.length === 1 ? "" : "s"} saved — impact is now value-weighted`); onClose() } catch (e) { toast.error((e as Error).message) } finally { setBusy(false) } }
  const weekly = rows.reduce((a, r) => a + r.units_per_week * r.value_per_unit, 0)
  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Truck className="h-5 w-5 text-theme-blue" /> Flows — what actually moves</DialogTitle><DialogDescription>One row per recurring shipment lane. With flows, "revenue at risk" is computed from real value per week, late penalties and days of cover — not from capacity proxies.</DialogDescription></DialogHeader>
        <div className="overflow-x-auto rounded-theme-md border border-theme-border-subtle">
          <table className="w-full text-xs"><thead className="bg-theme-bg-secondary text-[10px] uppercase tracking-wide text-theme-text-muted"><tr>{["Origin", "Destination", "Product", "Units/wk", "$/unit", "Lead d", "Penalty $/d", "Cover d", ""].map((h) => <th key={h} className="px-2 py-1.5 text-left">{h}</th>)}</tr></thead>
            <tbody>{rows.map((r, i) => (
              <tr key={i} className="border-t border-theme-border-subtle">
                <td className="px-1 py-1"><select value={r.origin_node_id} onChange={(e) => upd(i, "origin_node_id", e.target.value)} className="w-36 rounded border border-theme-border-subtle bg-theme-bg-surface px-1 py-1">{nodes.map((n) => <option key={n.id} value={n.id}>{n.data?.label ?? n.id}</option>)}</select></td>
                <td className="px-1 py-1"><select value={r.destination_node_id} onChange={(e) => upd(i, "destination_node_id", e.target.value)} className="w-36 rounded border border-theme-border-subtle bg-theme-bg-surface px-1 py-1">{nodes.map((n) => <option key={n.id} value={n.id}>{n.data?.label ?? n.id}</option>)}</select></td>
                <td className="px-1 py-1"><input value={r.product} onChange={(e) => upd(i, "product", e.target.value)} placeholder="PCBs" className="w-24 rounded border border-theme-border-subtle bg-theme-bg-surface px-1 py-1" /></td>
                {(["units_per_week", "value_per_unit", "lead_time_days", "penalty_per_day", "inventory_days"] as const).map((k) => <td key={k} className="px-1 py-1"><input type="number" value={r[k] ?? ""} onChange={(e) => upd(i, k, e.target.value === "" ? null : Number(e.target.value))} className="w-20 rounded border border-theme-border-subtle bg-theme-bg-surface px-1 py-1" /></td>)}
                <td className="px-1 py-1"><button type="button" onClick={() => setRows((x) => x.filter((_, j) => j !== i))} className="text-theme-text-muted hover:text-theme-red"><Trash2 className="h-3.5 w-3.5" /></button></td>
              </tr>))}
              {rows.length === 0 && <tr><td colSpan={9} className="px-3 py-6 text-center text-theme-text-muted">No flows yet. Add the lanes that carry value.</td></tr>}
            </tbody></table>
        </div>
        <div className="flex items-center justify-between"><span className="text-xs text-theme-text-secondary">Total ≈ <strong className="text-theme-text-primary">${Math.round(weekly).toLocaleString()}</strong> / week across {rows.length} flow{rows.length === 1 ? "" : "s"}</span>
          <div className="flex gap-2"><Button variant="outline" size="sm" onClick={add} className="gap-1.5"><Plus className="h-4 w-4" /> Add flow</Button><Button size="sm" onClick={save} disabled={busy} className="gap-1.5">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save</Button></div></div>
      </DialogContent>
    </Dialog>
  )
}
