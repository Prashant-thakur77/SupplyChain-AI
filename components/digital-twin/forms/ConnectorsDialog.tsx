"use client"

import { useEffect, useState } from "react"
import { Loader2, Plug, RefreshCw, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const KINDS = [
  { id: "rest", label: "Generic REST (JSON)", hint: "Any API that returns an array of records" },
  { id: "csv_url", label: "CSV export URL", hint: "A CSV your TMS/WMS publishes (SFTP-to-HTTP, S3 presigned…)" },
  { id: "sap", label: "SAP S/4HANA (OData)", hint: "API_PURCHASEORDER_PROCESS_SRV — Basic/OAuth header" },
  { id: "netsuite", label: "NetSuite (SuiteQL)", hint: "POST /services/rest/query/v1/suiteql — OAuth 1.0 header" },
  { id: "odoo", label: "Odoo (JSON-RPC)", hint: "stock.picking via /jsonrpc — db/uid/password in preset" },
] as const

/** Connect an ERP/TMS so flows and shipments stay in sync with the system of record. */
export function ConnectorsDialog({ isOpen, onClose, supplyChainId, userId }: { isOpen: boolean; onClose: () => void; supplyChainId: string; userId: string }) {
  const [rows, setRows] = useState<any[]>([]), [busy, setBusy] = useState<string | null>(null)
  const [f, setF] = useState({ name: "", kind: "csv_url", entity: "shipments", url: "", headers: "", records_path: "", fields: "", schedule_minutes: 60 })
  const load = () => fetch(`/api/connectors?supplyChainId=${supplyChainId}`).then((r) => r.json()).then((j) => setRows(j.connectors ?? []))
  useEffect(() => { if (isOpen) load() }, [isOpen, supplyChainId]) // eslint-disable-line react-hooks/exhaustive-deps
  const parseKv = (s: string) => Object.fromEntries(s.split(/\r?\n/).map((l) => l.split(/[:=]/)).filter((p) => p.length >= 2).map(([k, ...v]) => [k.trim(), v.join(":").trim()]))
  const add = async () => {
    if (!f.name || !f.url) { toast.error("Name and URL are required"); return }
    setBusy("add")
    try {
      const r = await fetch("/api/connectors", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ userId, supplyChainId, name: f.name, kind: f.kind, entity: f.entity, schedule_minutes: f.schedule_minutes, config: { url: f.url, headers: parseKv(f.headers), records_path: f.records_path || undefined, fields: parseKv(f.fields) } }) })
      const j = await r.json(); if (!r.ok) throw new Error(j.error)
      toast.success("Connector added — run a sync to pull records"); setF({ ...f, name: "", url: "", headers: "", fields: "" }); load()
    } catch (e) { toast.error((e as Error).message) } finally { setBusy(null) }
  }
  const sync = async (id: string) => { setBusy(id); try { const r = await fetch(`/api/connectors/${id}/sync`, { method: "POST" }); const j = await r.json(); if (!r.ok) throw new Error(j.error); toast.success(`Synced ${j.count} record(s)${j.unresolved?.length ? ` · ${j.unresolved.length} unresolved site(s)` : ""}`) } catch (e) { toast.error((e as Error).message) } finally { setBusy(null); load() } }
  const kind = KINDS.find((k) => k.id === f.kind)!
  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Plug className="h-5 w-5 text-theme-blue" /> Integrations</DialogTitle><DialogDescription>Pull flows and shipments from your ERP, TMS or carrier portal on a schedule. Site names in the source are matched to your twin's node names.</DialogDescription></DialogHeader>
        <div className="grid gap-2 rounded-theme-md border border-theme-border-subtle p-3 sm:grid-cols-2">
          <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Name (e.g. SAP PO feed)" className="rounded-theme-md border border-theme-border-default bg-theme-bg-secondary px-2 py-1.5 text-sm" />
          <select value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })} className="rounded-theme-md border border-theme-border-default bg-theme-bg-secondary px-2 py-1.5 text-sm">{KINDS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}</select>
          <input value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} placeholder="URL" className="rounded-theme-md border border-theme-border-default bg-theme-bg-secondary px-2 py-1.5 font-mono text-xs sm:col-span-2" />
          <select value={f.entity} onChange={(e) => setF({ ...f, entity: e.target.value })} className="rounded-theme-md border border-theme-border-default bg-theme-bg-secondary px-2 py-1.5 text-sm"><option value="shipments">Shipments / POs</option><option value="flows">Flows (lane volumes)</option></select>
          <input type="number" value={f.schedule_minutes} onChange={(e) => setF({ ...f, schedule_minutes: Number(e.target.value) })} className="rounded-theme-md border border-theme-border-default bg-theme-bg-secondary px-2 py-1.5 text-sm" placeholder="Sync every N minutes" />
          <textarea value={f.headers} onChange={(e) => setF({ ...f, headers: e.target.value })} rows={2} placeholder={"Headers, one per line\nAuthorization: Bearer …"} className="rounded-theme-md border border-theme-border-default bg-theme-bg-secondary px-2 py-1.5 font-mono text-xs" />
          <textarea value={f.fields} onChange={(e) => setF({ ...f, fields: e.target.value })} rows={2} placeholder={"Field mapping (canonical=source)\nreference=containerNo\norigin=pol"} className="rounded-theme-md border border-theme-border-default bg-theme-bg-secondary px-2 py-1.5 font-mono text-xs" />
          {f.kind !== "csv_url" && <input value={f.records_path} onChange={(e) => setF({ ...f, records_path: e.target.value })} placeholder="records_path (e.g. d.results — preset default if empty)" className="rounded-theme-md border border-theme-border-default bg-theme-bg-secondary px-2 py-1.5 font-mono text-xs sm:col-span-2" />}
          <div className="flex items-center justify-between sm:col-span-2"><span className="text-xs text-theme-text-muted">{kind.hint}</span><Button size="sm" onClick={add} disabled={busy === "add"}>{busy === "add" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add connector"}</Button></div>
        </div>
        <ul className="divide-y divide-theme-border-subtle rounded-theme-md border border-theme-border-subtle">
          {rows.map((c) => <li key={c.id} className="flex items-center gap-3 px-3 py-2 text-sm">
            <div className="min-w-0 flex-1"><div className="font-medium text-theme-text-primary">{c.name} <span className="ml-1 rounded bg-theme-bg-secondary px-1.5 py-0.5 text-[10px] uppercase text-theme-text-muted">{c.kind} · {c.entity}</span></div>
              <div className="truncate text-xs text-theme-text-muted">{c.last_sync_at ? `${new Date(c.last_sync_at).toLocaleString()} · ${c.last_status}${c.last_count != null ? ` · ${c.last_count} rows` : ""}${c.last_error ? ` · ${c.last_error}` : ""}` : "never synced"} · every {c.schedule_minutes} min</div></div>
            <Button size="sm" variant="outline" onClick={() => sync(c.id)} disabled={busy === c.id} className="gap-1">{busy === c.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} Sync</Button>
            <button type="button" onClick={async () => { await fetch(`/api/connectors?id=${c.id}`, { method: "DELETE" }); load() }} className="text-theme-text-muted hover:text-theme-red"><Trash2 className="h-4 w-4" /></button>
          </li>)}
          {rows.length === 0 && <li className="px-3 py-6 text-center text-sm text-theme-text-muted">No integrations yet.</li>}
        </ul>
      </DialogContent>
    </Dialog>
  )
}
