"use client"

import { useEffect, useState } from "react"
import { Loader2, Save, Ship } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

interface Row { mode: string; usd_per_km: number; km_per_day: number; fixed_days: number; min_usd: number; co2_g_per_tkm: number; is_default?: boolean }

/** Org-level planning rate card: drives lane estimation and the carbon figure. */
export function RateCardCard({ orgId, canEdit }: { orgId: string; canEdit: boolean }) {
  const [rows, setRows] = useState<Row[] | null>(null), [busy, setBusy] = useState(false)
  useEffect(() => { fetch(`/api/rate-cards?orgId=${orgId}`).then((r) => r.json()).then((j) => setRows(j.rows)) }, [orgId])
  const save = async () => { setBusy(true); try { const r = await fetch("/api/rate-cards", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ orgId, rows }) }); const j = await r.json(); if (!r.ok) throw new Error(j.error); toast.success("Rate card saved — new lane estimates use it") } catch (e) { toast.error((e as Error).message) } finally { setBusy(false) } }
  if (!rows) return null
  return (
    <div className="mt-4 rounded-theme-lg border border-theme-border-subtle bg-theme-bg-surface p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-theme-text-primary"><Ship className="h-4 w-4 text-theme-blue" /> Rate card <span className="text-xs font-normal text-theme-text-muted">— planning estimates per mode; carrier quotes override these per lane</span></div>
      <div className="mt-3 overflow-x-auto"><table className="w-full text-xs"><thead className="text-[10px] uppercase tracking-wide text-theme-text-muted"><tr>{["Mode", "$ / km", "km / day", "Fixed days", "Min $", "gCO₂ / t·km"].map((h) => <th key={h} className="px-2 py-1 text-left">{h}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={r.mode} className="border-t border-theme-border-subtle"><td className="px-2 py-1 font-medium capitalize text-theme-text-primary">{r.mode}{r.is_default && <span className="ml-1 text-[9px] text-theme-text-muted">default</span>}</td>{(["usd_per_km", "km_per_day", "fixed_days", "min_usd", "co2_g_per_tkm"] as const).map((k) => <td key={k} className="px-2 py-1"><input type="number" step="0.01" disabled={!canEdit} value={r[k]} onChange={(e) => setRows((x) => x!.map((y, j) => (j === i ? { ...y, [k]: Number(e.target.value), is_default: false } : y)))} className="w-20 rounded border border-theme-border-subtle bg-theme-bg-secondary px-1 py-1 disabled:opacity-60" /></td>)}</tr>)}</tbody></table></div>
      {canEdit && <div className="mt-3 flex justify-end"><Button size="sm" onClick={save} disabled={busy} className="gap-1.5">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save rate card</Button></div>}
    </div>
  )
}
