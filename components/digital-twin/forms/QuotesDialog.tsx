"use client"

import { useEffect, useState } from "react"
import { FileText, Loader2, Trash2, Upload } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useDigitalTwinStore } from "@/lib/digitalTwinStore"

/** Paste carrier quotes (CSV: origin,destination,mode,carrier,cost,transit_days,valid_until). Names or ids for sites. */
export function QuotesDialog({ isOpen, onClose, supplyChainId, userId }: { isOpen: boolean; onClose: () => void; supplyChainId: string; userId: string }) {
  const nodes = useDigitalTwinStore((s) => s.nodes).filter((n) => n.type !== "group")
  const [quotes, setQuotes] = useState<any[]>([]), [csv, setCsv] = useState(""), [busy, setBusy] = useState(false)
  const load = () => fetch(`/api/quotes?supplyChainId=${supplyChainId}`).then((r) => r.json()).then((j) => setQuotes(j.quotes ?? []))
  useEffect(() => { if (isOpen) load() }, [isOpen, supplyChainId]) // eslint-disable-line react-hooks/exhaustive-deps
  const label = (id: string) => nodes.find((n) => n.id === id)?.data?.label ?? id
  const resolve = (ref: string) => { const r = ref.trim().toLowerCase(); return nodes.find((n) => n.id.toLowerCase() === r || String(n.data?.label ?? "").toLowerCase() === r)?.id ?? null }
  const importCsv = async () => {
    const lines = csv.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
    const body = lines.filter((l) => !/^origin/i.test(l)).map((l) => { const [o, d, mode, carrier, cost, days, valid] = l.split(",").map((x) => x.trim()); return { origin_node_id: resolve(o), destination_node_id: resolve(d), mode, carrier, cost, transit_days: days, valid_until: valid } }).filter((q) => q.origin_node_id && q.destination_node_id)
    if (!body.length) { toast.error("No rows matched your sites — use site names or ids."); return }
    setBusy(true)
    try { const r = await fetch("/api/quotes", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ userId, supplyChainId, quotes: body }) }); const j = await r.json(); if (!r.ok) throw new Error(j.error); toast.success(`${j.inserted} quote(s) imported — lanes now use real prices`); setCsv(""); load() } catch (e) { toast.error((e as Error).message) } finally { setBusy(false) }
  }
  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-theme-blue" /> Carrier quotes</DialogTitle><DialogDescription>Real prices beat estimates. The cheapest valid quote per lane and mode overrides the lane's cost and days for routing.</DialogDescription></DialogHeader>
        <textarea value={csv} onChange={(e) => setCsv(e.target.value)} rows={5} placeholder={"origin,destination,mode,carrier,cost,transit_days,valid_until\nShenzhen Plant,Port of Singapore,sea,Maersk,980,5,2026-12-31"} className="w-full rounded-theme-md border border-theme-border-default bg-theme-bg-secondary p-3 font-mono text-xs text-theme-text-primary" />
        <div className="flex justify-end"><Button size="sm" onClick={importCsv} disabled={busy || !csv.trim()} className="gap-1.5">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Import</Button></div>
        <div className="overflow-x-auto rounded-theme-md border border-theme-border-subtle"><table className="w-full text-xs"><thead className="bg-theme-bg-secondary text-[10px] uppercase tracking-wide text-theme-text-muted"><tr>{["Lane", "Mode", "Carrier", "Cost", "Days", "Valid until", ""].map((h) => <th key={h} className="px-2 py-1.5 text-left">{h}</th>)}</tr></thead>
          <tbody>{quotes.map((q) => <tr key={q.id} className="border-t border-theme-border-subtle"><td className="px-2 py-1.5 text-theme-text-primary">{label(q.origin_node_id)} → {label(q.destination_node_id)}</td><td className="px-2 py-1.5">{q.mode}</td><td className="px-2 py-1.5">{q.carrier ?? "—"}</td><td className="px-2 py-1.5 font-mono">${Math.round(q.cost).toLocaleString()}</td><td className="px-2 py-1.5 font-mono">{q.transit_days}</td><td className="px-2 py-1.5">{q.valid_until ?? "—"}</td><td className="px-2 py-1.5"><button type="button" onClick={async () => { await fetch(`/api/quotes?id=${q.id}`, { method: "DELETE" }); load() }} className="text-theme-text-muted hover:text-theme-red"><Trash2 className="h-3.5 w-3.5" /></button></td></tr>)}
            {quotes.length === 0 && <tr><td colSpan={7} className="px-3 py-6 text-center text-theme-text-muted">No quotes yet.</td></tr>}</tbody></table></div>
      </DialogContent>
    </Dialog>
  )
}
