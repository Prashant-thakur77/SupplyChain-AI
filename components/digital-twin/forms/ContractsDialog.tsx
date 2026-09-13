"use client"

import { useEffect, useState } from "react"
import { FileSignature, Loader2, Sparkles, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useDigitalTwinStore } from "@/lib/digitalTwinStore"

/** Contracts & SLAs: paste a clause, the Contracts agent extracts the terms, you attach them to a site. Penalties then show up in every impact estimate. */
export function ContractsDialog({ isOpen, onClose, supplyChainId, userId }: { isOpen: boolean; onClose: () => void; supplyChainId: string; userId: string }) {
  const nodes = useDigitalTwinStore((s) => s.nodes).filter((n) => n.type !== "group")
  const [rows, setRows] = useState<any[]>([]), [text, setText] = useState(""), [drafts, setDrafts] = useState<any[]>([]), [busy, setBusy] = useState<string | null>(null)
  const load = () => fetch(`/api/contracts?supplyChainId=${supplyChainId}`).then((r) => r.json()).then((j) => setRows(j.contracts ?? []))
  useEffect(() => { if (isOpen) load() }, [isOpen, supplyChainId]) // eslint-disable-line react-hooks/exhaustive-deps
  const label = (id?: string | null) => (id ? nodes.find((n) => n.id === id)?.data?.label ?? id : "network-wide")
  const guessNode = (hint?: string | null) => { if (!hint) return null; const h = hint.toLowerCase(); return nodes.find((n) => String(n.data?.label ?? "").toLowerCase().includes(h) || h.includes(String(n.data?.label ?? "").toLowerCase()))?.id ?? null }
  const parse = async () => {
    setBusy("parse")
    try { const r = await fetch("/api/agent/contracts-parse", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text, userId, supplyChainId }) }); const j = await r.json(); if (!r.ok) throw new Error(j.detail ?? j.error); setDrafts((j.contracts ?? []).map((c: any) => ({ ...c, node_id: guessNode(c.site_hint), raw_text: text }))); if (!j.contracts?.length) toast.message("No clauses found in that text") } catch (e) { toast.error((e as Error).message) } finally { setBusy(null) }
  }
  const save = async () => {
    setBusy("save")
    try { const r = await fetch("/api/contracts", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ userId, supplyChainId, contracts: drafts }) }); const j = await r.json(); if (!r.ok) throw new Error(j.error); toast.success(`${j.inserted} contract term(s) saved — penalties now count in impact estimates`); setDrafts([]); setText(""); load() } catch (e) { toast.error((e as Error).message) } finally { setBusy(null) }
  }
  const inp = "rounded border border-theme-border-default bg-theme-bg-surface px-1.5 py-1 text-xs text-theme-text-primary"
  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><FileSignature className="h-5 w-5 text-theme-blue" /> Contracts & SLAs</DialogTitle><DialogDescription>Paste the delivery / penalty clause from a customer, supplier or carrier contract. The Contracts agent extracts the terms; the Impact agent adds the penalties to every disruption's cost.</DialogDescription></DialogHeader>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} placeholder={"e.g. Supplier shall deliver to Buyer's Berlin DC within 30 days of PO. For each day of delay beyond a 2-day grace period, Supplier pays liquidated damages of USD 1,500 per day, capped at USD 30,000 per order. Target OTIF 98%."} className="w-full rounded-theme-md border border-theme-border-default bg-theme-bg-secondary p-3 text-sm text-theme-text-primary" />
        <div className="flex justify-end"><Button size="sm" onClick={parse} disabled={busy === "parse" || !text.trim()} className="gap-1.5">{busy === "parse" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Extract terms</Button></div>
        {drafts.length > 0 && (
          <div className="rounded-theme-md border border-theme-blue/30 bg-theme-blue-soft/40 p-3">
            <div className="mb-2 text-xs font-semibold text-theme-blue">Review before saving</div>
            <div className="space-y-2">{drafts.map((d, i) => <div key={i} className="grid gap-1 sm:grid-cols-[1.2fr_0.8fr_1.2fr_0.6fr_0.7fr_0.7fr_0.6fr] sm:items-center">
              <input value={d.counterparty} onChange={(e) => setDrafts(drafts.map((x, j) => (j === i ? { ...x, counterparty: e.target.value } : x)))} className={inp} placeholder="Counterparty" />
              <select value={d.kind} onChange={(e) => setDrafts(drafts.map((x, j) => (j === i ? { ...x, kind: e.target.value } : x)))} className={inp}><option value="customer">customer</option><option value="supplier">supplier</option><option value="carrier">carrier</option></select>
              <select value={d.node_id ?? ""} onChange={(e) => setDrafts(drafts.map((x, j) => (j === i ? { ...x, node_id: e.target.value || null } : x)))} className={inp}><option value="">network-wide</option>{nodes.map((n) => <option key={n.id} value={n.id}>{String(n.data?.label ?? n.id)}</option>)}</select>
              <input type="number" value={d.grace_days ?? 0} onChange={(e) => setDrafts(drafts.map((x, j) => (j === i ? { ...x, grace_days: Number(e.target.value) } : x)))} className={inp} title="Grace days" />
              <input type="number" value={d.penalty_per_day_usd ?? 0} onChange={(e) => setDrafts(drafts.map((x, j) => (j === i ? { ...x, penalty_per_day_usd: Number(e.target.value) } : x)))} className={inp} title="Penalty per day (USD)" />
              <input type="number" value={d.penalty_cap_usd ?? ""} onChange={(e) => setDrafts(drafts.map((x, j) => (j === i ? { ...x, penalty_cap_usd: e.target.value === "" ? null : Number(e.target.value) } : x)))} className={inp} placeholder="cap" title="Penalty cap (USD)" />
              <input type="number" value={d.service_level_pct ?? ""} onChange={(e) => setDrafts(drafts.map((x, j) => (j === i ? { ...x, service_level_pct: e.target.value === "" ? null : Number(e.target.value) } : x)))} className={inp} placeholder="OTIF %" />
            </div>)}</div>
            <div className="mt-2 flex items-center justify-between text-[10px] text-theme-text-muted"><span>columns: counterparty · kind · site · grace days · $/day · cap · service level</span><Button size="sm" onClick={save} disabled={busy === "save"}>{busy === "save" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save terms"}</Button></div>
          </div>
        )}
        <div className="overflow-x-auto rounded-theme-md border border-theme-border-subtle"><table className="w-full text-xs"><thead className="bg-theme-bg-secondary text-[10px] uppercase tracking-wide text-theme-text-muted"><tr>{["Counterparty", "Kind", "Site", "Lead time", "Grace", "$/day", "Cap", "SLA", ""].map((h) => <th key={h} className="px-2 py-1.5 text-left">{h}</th>)}</tr></thead>
          <tbody>{rows.map((c) => <tr key={c.id} className="border-t border-theme-border-subtle"><td className="px-2 py-1.5 font-medium text-theme-text-primary">{c.counterparty}</td><td className="px-2 py-1.5">{c.kind}</td><td className="px-2 py-1.5">{label(c.node_id)}</td><td className="px-2 py-1.5 font-mono">{c.lead_time_commit_days ?? "—"}d</td><td className="px-2 py-1.5 font-mono">{c.grace_days}d</td><td className="px-2 py-1.5 font-mono">${Math.round(c.penalty_per_day_usd).toLocaleString("en-US")}</td><td className="px-2 py-1.5 font-mono">{c.penalty_cap_usd != null ? `$${Math.round(c.penalty_cap_usd).toLocaleString("en-US")}` : "uncapped"}</td><td className="px-2 py-1.5">{c.service_level_pct != null ? `${c.service_level_pct}%` : "—"}</td><td className="px-2 py-1.5"><button type="button" onClick={async () => { await fetch(`/api/contracts?id=${c.id}`, { method: "DELETE" }); load() }} className="text-theme-text-muted hover:text-theme-red"><Trash2 className="h-3.5 w-3.5" /></button></td></tr>)}
            {rows.length === 0 && <tr><td colSpan={9} className="px-3 py-6 text-center text-theme-text-muted">No contract terms yet.</td></tr>}</tbody></table></div>
      </DialogContent>
    </Dialog>
  )
}
