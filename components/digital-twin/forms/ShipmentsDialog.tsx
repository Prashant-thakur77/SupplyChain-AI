"use client"

import { useEffect, useState } from "react"
import { Loader2, RefreshCw, Ship, Upload } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useDigitalTwinStore } from "@/lib/digitalTwinStore"

const STATUS: Record<string, string> = { planned: "text-theme-text-muted", in_transit: "text-theme-blue", delayed: "text-theme-amber", arrived: "text-theme-green", cancelled: "text-theme-red" }

/** Shipments in flight. CSV: reference,origin,destination,mode,carrier,etd,planned_eta,value_usd. Carriers push milestones to /api/shipments/events. */
export function ShipmentsDialog({ isOpen, onClose, supplyChainId, userId }: { isOpen: boolean; onClose: () => void; supplyChainId: string; userId: string }) {
  const nodes = useDigitalTwinStore((s) => s.nodes).filter((n) => n.type !== "group")
  const [rows, setRows] = useState<any[]>([]), [csv, setCsv] = useState(""), [busy, setBusy] = useState(false), [provider, setProvider] = useState("")
  const load = (poll = false) => fetch(`/api/shipments?supplyChainId=${supplyChainId}${poll ? "&poll=1" : ""}`).then((r) => r.json()).then((j) => { setRows(j.shipments ?? []); setProvider(j.provider ?? "") })
  useEffect(() => { if (isOpen) load() }, [isOpen, supplyChainId]) // eslint-disable-line react-hooks/exhaustive-deps
  const label = (id: string) => nodes.find((n) => n.id === id)?.data?.label ?? id
  const resolve = (ref: string) => { const r = ref.trim().toLowerCase(); return nodes.find((n) => n.id.toLowerCase() === r || String(n.data?.label ?? "").toLowerCase() === r)?.id ?? null }
  const importCsv = async () => {
    const body = csv.split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !/^reference/i.test(l)).map((l) => { const [reference, o, d, mode, carrier, etd, eta, value] = l.split(",").map((x) => x.trim()); return { reference, origin_node_id: resolve(o), destination_node_id: resolve(d), mode, carrier, etd, planned_eta: eta, value_usd: value } }).filter((s) => s.reference && s.origin_node_id && s.destination_node_id)
    if (!body.length) { toast.error("No rows matched your sites — use site names or ids."); return }
    setBusy(true)
    try { const r = await fetch("/api/shipments", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ userId, supplyChainId, shipments: body }) }); const j = await r.json(); if (!r.ok) throw new Error(j.error); toast.success(`${j.upserted} shipment(s) saved`); setCsv(""); load() } catch (e) { toast.error((e as Error).message) } finally { setBusy(false) }
  }
  const fmt = (d?: string | null) => (d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—")
  const delayed = rows.filter((r) => r.status === "delayed")
  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Ship className="h-5 w-5 text-theme-blue" /> Shipments in flight</DialogTitle><DialogDescription>Track what is moving on each lane. Carriers can push milestones to <code className="font-mono text-[11px]">POST /api/shipments/events</code>; Sentinel treats a delayed shipment of material value as an event.</DialogDescription></DialogHeader>
        <textarea value={csv} onChange={(e) => setCsv(e.target.value)} rows={4} placeholder={"reference,origin,destination,mode,carrier,etd,planned_eta,value_usd\nMSKU7712345,Shenzhen Plant,Port of Singapore,sea,Maersk,2026-09-10,2026-09-16,180000"} className="w-full rounded-theme-md border border-theme-border-default bg-theme-bg-secondary p-3 font-mono text-xs text-theme-text-primary" />
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-theme-text-muted">{rows.length} shipment(s) · {delayed.length} delayed · provider: {provider || "—"}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => load(true)} className="gap-1.5"><RefreshCw className="h-4 w-4" /> Poll carrier</Button>
            <Button size="sm" onClick={importCsv} disabled={busy || !csv.trim()} className="gap-1.5">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Import</Button>
          </div>
        </div>
        <div className="overflow-x-auto rounded-theme-md border border-theme-border-subtle"><table className="w-full text-xs"><thead className="bg-theme-bg-secondary text-[10px] uppercase tracking-wide text-theme-text-muted"><tr>{["Ref", "Lane", "Mode", "Status", "Progress", "ETD", "ETA", "Value", "Last event"].map((h) => <th key={h} className="px-2 py-1.5 text-left">{h}</th>)}</tr></thead>
          <tbody>{rows.map((s) => <tr key={s.id} className="border-t border-theme-border-subtle"><td className="px-2 py-1.5 font-mono text-theme-text-primary">{s.reference}</td><td className="px-2 py-1.5">{label(s.origin_node_id)} → {label(s.destination_node_id)}</td><td className="px-2 py-1.5">{s.mode}</td><td className={`px-2 py-1.5 font-medium ${STATUS[s.status] ?? ""}`}>{s.status.replace("_", " ")}</td>
            <td className="px-2 py-1.5"><div className="h-1.5 w-16 overflow-hidden rounded-full bg-theme-bg-secondary"><div className={`h-full ${s.status === "delayed" ? "bg-theme-amber" : "bg-theme-blue"}`} style={{ width: `${Math.round((s.progress ?? 0) * 100)}%` }} /></div></td>
            <td className="px-2 py-1.5">{fmt(s.etd)}</td><td className="px-2 py-1.5">{fmt(s.current_eta ?? s.planned_eta)}{s.current_eta && s.planned_eta && s.current_eta > s.planned_eta && <span className="ml-1 text-theme-amber">+{Math.round((new Date(s.current_eta).getTime() - new Date(s.planned_eta).getTime()) / 86400000)}d</span>}</td>
            <td className="px-2 py-1.5 font-mono">${Math.round(s.value_usd ?? 0).toLocaleString("en-US")}</td><td className="max-w-[180px] truncate px-2 py-1.5 text-theme-text-secondary">{s.last_event ?? "—"}</td></tr>)}
            {rows.length === 0 && <tr><td colSpan={9} className="px-3 py-6 text-center text-theme-text-muted">No shipments yet — import a CSV or connect a carrier feed.</td></tr>}</tbody></table></div>
      </DialogContent>
    </Dialog>
  )
}
