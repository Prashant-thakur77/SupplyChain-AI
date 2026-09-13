"use client"

import { Fragment, useEffect, useState } from "react"
import { Brain, Loader2, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/ui/page-header"
import { cn } from "@/lib/utils"

type Score = { node_id: string; label: string; score: number; level: string; components: Record<string, number>; reasons: string[] }
type Chain = { supply_chain_id: string; name: string }
const LEVEL: Record<string, string> = { Critical: "border-theme-red/40 bg-theme-red-soft text-theme-red", High: "border-theme-red/30 bg-theme-red-soft text-theme-red", Medium: "border-theme-amber/30 bg-theme-amber-soft text-theme-amber", Low: "border-theme-green/30 bg-theme-green-soft text-theme-green" }
const COMP: Record<string, { label: string; hint: string }> = {
  concentration: { label: "Concentration", hint: "share of lanes whose healthy path runs through this site" },
  fragility: { label: "Fragility", hint: "how much a failure here costs to bypass" },
  geo: { label: "Geography", hint: "country / chokepoint risk" },
  news: { label: "News", hint: "disruption alerts touching this site in the last 30 days" },
  weather: { label: "Weather", hint: "adverse conditions right now" },
}

/** Explainable, deterministic site risk: structure (concentration, fragility) + geography + live signals (news, weather). */
export function RiskPage() {
  const [chains, setChains] = useState<Chain[]>([]), [sel, setSel] = useState<string>(""), [scores, setScores] = useState<Score[] | null>(null), [busy, setBusy] = useState(false), [open, setOpen] = useState<string | null>(null)
  useEffect(() => { fetch("/api/me").then((r) => r.json()).then(async (j) => { if (!j.user?.id) return; const r = await fetch(`/api/policies?userId=${j.user.id}`); const p = await r.json(); const cs = (p.twins ?? []).map((t: any) => ({ supply_chain_id: t.id, name: t.name })); setChains(cs); if (cs[0]) setSel(cs[0].supply_chain_id) }).catch(() => undefined) }, [])
  const run = async (persist: boolean) => {
    if (!sel) return
    setBusy(true)
    try { const r = await fetch("/api/agent/risk", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ supplyChainId: sel, persist }) }); const j = await r.json(); if (!r.ok) throw new Error(j.detail ?? j.error); setScores(j.scores ?? []); if (persist) toast.success("Risk levels written to the twin") } catch (e) { toast.error((e as Error).message) } finally { setBusy(false) }
  }
  useEffect(() => { if (sel) run(false) }, [sel]) // eslint-disable-line react-hooks/exhaustive-deps
  const max = Math.max(1, ...(scores?.map((s) => s.score) ?? [1]))
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader eyebrow="Explainable risk" title="Site risk" subtitle="Every site scored 0–5 from network structure (how much flow depends on it, how expensive it is to bypass), geography, and live news and weather signals. No black box: each score lists its reasons." icon={<Brain className="h-5 w-5" />}
        actions={<div className="flex items-center gap-2">
          {chains.length > 1 && <select value={sel} onChange={(e) => setSel(e.target.value)} className="rounded-theme-md border border-theme-border-subtle bg-theme-bg-secondary px-2 py-1.5 text-sm text-theme-text-primary">{chains.map((c) => <option key={c.supply_chain_id} value={c.supply_chain_id}>{c.name}</option>)}</select>}
          <Button size="sm" variant="outline" onClick={() => run(false)} disabled={busy || !sel} className="gap-1.5"><RefreshCw className={cn("h-4 w-4", busy && "animate-spin")} /> Score</Button>
          <Button size="sm" onClick={() => run(true)} disabled={busy || !sel} className="gap-1.5">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Write to twin</Button>
        </div>} />
      {!sel && <p className="mt-6 text-sm text-theme-text-muted">Create a digital twin first — risk is scored per site.</p>}
      {scores && (
        <div className="mt-6 overflow-x-auto rounded-theme-lg border border-theme-border-subtle bg-theme-bg-surface">
          <table className="w-full text-sm">
            <thead className="bg-theme-bg-secondary text-[11px] uppercase tracking-wide text-theme-text-muted"><tr><th className="px-3 py-2 text-left">Site</th><th className="px-3 py-2 text-left">Level</th><th className="px-3 py-2 text-left">Score</th>{Object.keys(COMP).map((k) => <th key={k} className="px-3 py-2 text-right" title={COMP[k].hint}>{COMP[k].label}</th>)}</tr></thead>
            <tbody>{scores.map((s) => (
              <Fragment key={s.node_id}>
                <tr onClick={() => setOpen(open === s.node_id ? null : s.node_id)} className="cursor-pointer border-t border-theme-border-subtle hover:bg-theme-bg-secondary/40">
                  <td className="px-3 py-2 font-medium text-theme-text-primary">{s.label}</td>
                  <td className="px-3 py-2"><span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", LEVEL[s.level] ?? LEVEL.Low)}>{s.level}</span></td>
                  <td className="px-3 py-2"><div className="flex items-center gap-2"><div className="h-1.5 w-24 overflow-hidden rounded-full bg-theme-bg-secondary"><div className={cn("h-full", s.score >= 3.5 ? "bg-theme-red" : s.score >= 2 ? "bg-theme-amber" : "bg-theme-green")} style={{ width: `${(s.score / Math.max(5, max)) * 100}%` }} /></div><span className="font-mono text-xs">{s.score.toFixed(1)}</span></div></td>
                  {Object.keys(COMP).map((k) => <td key={k} className={cn("px-3 py-2 text-right font-mono text-xs", (s.components[k] ?? 0) >= 0.6 ? "text-theme-red" : (s.components[k] ?? 0) >= 0.3 ? "text-theme-amber" : "text-theme-text-muted")}>{Math.round((s.components[k] ?? 0) * 100)}%</td>)}
                </tr>
                {open === s.node_id && <tr className="border-t border-theme-border-subtle bg-theme-bg-secondary/30"><td colSpan={3 + Object.keys(COMP).length} className="px-4 py-2"><ul className="space-y-0.5 text-xs text-theme-text-secondary">{s.reasons.length ? s.reasons.map((r, i) => <li key={i}>• {r}</li>) : <li>No notable drivers — structurally redundant and quiet.</li>}</ul></td></tr>}
              </Fragment>
            ))}</tbody>
          </table>
        </div>
      )}
      {scores && <p className="mt-3 text-xs text-theme-text-muted">Sentinel recomputes these after every scan; "Write to twin" stores them on the nodes so the canvas, dashboard and Router see the same numbers.</p>}
    </div>
  )
}
