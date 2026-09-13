"use client"

import { useState } from "react"
import { AlertTriangle, ChevronDown, ChevronUp, Loader2, ShieldCheck, Zap } from "lucide-react"
import ReactMarkdown from "react-markdown"
import { cn } from "@/lib/utils"
import type { IncidentEvent } from "@/types/agent"

export interface ResilienceReport { score: number; grade: string; total_lanes: number; single_points_of_failure: string[]; single_source_sites?: string[]; cases: { kind: "node" | "lane" | "endpoint"; id: string; label: string; lanes_affected: number; lanes_reroutable: number; lanes_cut: number; best_added_cost: number; best_added_days: number; downstream_nodes: number; fragility: number }[]; summary: string[]; network: Record<string, any>; narrative?: string; benchmark?: { size_band: string; percentile: number; peers: number; reference: number; median_score: number | null; top_quartile_score: number | null; gap_to_top_quartile: number } }

const GRADE: Record<string, string> = { A: "text-theme-green border-theme-green/30 bg-theme-green-soft", B: "text-theme-green border-theme-green/30 bg-theme-green-soft", C: "text-theme-amber border-theme-amber/30 bg-theme-amber-soft", D: "text-theme-red border-theme-red/30 bg-theme-red-soft", E: "text-theme-red border-theme-red/30 bg-theme-red-soft" }

interface Props {
  /** How to fetch the report (demo vs app). */
  fetchReport: () => Promise<ResilienceReport>
  /** Optional: fail a node/lane straight from the table by starting the incident graph. */
  onFail?: (event: IncidentEvent) => void
  compact?: boolean
  className?: string
}

/** Deterministic "where am I fragile?" panel: score, single points of failure, ranked fragility table. */
export function ResiliencePanel({ fetchReport, onFail, compact, className }: Props) {
  const [rep, setRep] = useState<ResilienceReport | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [open, setOpen] = useState(!compact)
  const run = async () => { setBusy(true); setErr(null); try { setRep(await fetchReport()); setOpen(true) } catch (e) { setErr((e as Error).message) } finally { setBusy(false) } }

  return (
    <div className={cn("rounded-theme-lg border border-theme-border-subtle bg-theme-bg-surface", className)}>
      <div className="flex items-center gap-2 px-3 py-2">
        <ShieldCheck className="h-4 w-4 text-theme-blue" />
        <span className="text-sm font-semibold text-theme-text-primary">Resilience audit</span>
        {rep && <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-bold", GRADE[rep.grade])}>{rep.grade} · {rep.score}/100</span>}
        <span className="ml-auto flex items-center gap-1">
          <button type="button" onClick={run} disabled={busy} className="inline-flex items-center gap-1.5 rounded-full border border-theme-blue/30 bg-theme-blue-soft px-2.5 py-1 text-[11px] font-semibold text-theme-blue disabled:opacity-60">{busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}{rep ? "Re-run" : "Run audit"}</button>
          {rep && <button type="button" onClick={() => setOpen((o) => !o)} className="rounded p-1 text-theme-text-muted">{open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</button>}
        </span>
      </div>
      {err && <p className="px-3 pb-2 text-xs text-theme-red">{err}</p>}
      {!rep && !busy && <p className="px-3 pb-3 text-xs text-theme-text-muted">Fails every site and lane one at a time (pure routing math, no model) and ranks what hurts most.</p>}
      {rep && open && (
        <div className="space-y-3 border-t border-theme-border-subtle p-3">
          {rep.single_points_of_failure.length > 0 ? (
            <div className="flex items-start gap-2 rounded-theme-md border border-theme-red/30 bg-theme-red-soft p-2.5 text-sm text-theme-text-primary"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-theme-red" /><span><strong>{rep.single_points_of_failure.length} single point{rep.single_points_of_failure.length > 1 ? "s" : ""} of failure:</strong> {rep.single_points_of_failure.join(", ")}. One event there stops flow with no bypass.</span></div>
          ) : (
            <div className="flex items-center gap-2 rounded-theme-md border border-theme-green/30 bg-theme-green-soft p-2.5 text-sm text-theme-text-primary"><ShieldCheck className="h-4 w-4 text-theme-green" /> No single point of failure — every site has a bypass.</div>
          )}
          {rep.single_source_sites && rep.single_source_sites.length > 0 && <div className="rounded-theme-md border border-theme-amber/30 bg-theme-amber-soft p-2.5 text-sm text-theme-text-primary"><strong>Single-sourced:</strong> {rep.single_source_sites.join(", ")} — an outage stops flow; the fix is a second site (dual sourcing / backup DC), not a route.</div>}
          {rep.benchmark && (
            <div className="rounded-theme-md border border-theme-border-subtle bg-theme-bg-secondary/60 p-2.5 text-xs text-theme-text-secondary">
              <div className="flex items-center justify-between"><span className="font-semibold text-theme-text-primary">Benchmark · {rep.benchmark.size_band} networks</span><span className={cn("font-bold", rep.benchmark.percentile >= 75 ? "text-theme-green" : rep.benchmark.percentile >= 40 ? "text-theme-amber" : "text-theme-red")}>better than {rep.benchmark.percentile}%</span></div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-theme-bg-surface"><div className="h-full rounded-full bg-theme-blue" style={{ width: `${rep.benchmark.percentile}%` }} /></div>
              <div className="mt-1 flex justify-between text-[10px] text-theme-text-muted"><span>median {rep.benchmark.median_score}</span><span>{rep.benchmark.gap_to_top_quartile > 0 ? `+${rep.benchmark.gap_to_top_quartile} pts to top quartile` : "top quartile"}</span><span>{rep.benchmark.peers + rep.benchmark.reference} networks, anonymised</span></div>
            </div>
          )}
          <ul className="space-y-1 text-xs text-theme-text-secondary">{rep.summary.map((s, i) => <li key={i}>• {s}</li>)}</ul>
          <div className="overflow-x-auto rounded-theme-md border border-theme-border-subtle">
            <table className="w-full text-xs">
              <thead className="bg-theme-bg-secondary text-[10px] uppercase tracking-wide text-theme-text-muted"><tr><th className="px-2 py-1.5 text-left">If this fails…</th><th className="px-2 py-1.5 text-right">Lanes</th><th className="px-2 py-1.5 text-right">Cut</th><th className="px-2 py-1.5 text-right">Best bypass</th><th className="px-2 py-1.5 text-right">Fragility</th>{onFail && <th className="px-2 py-1.5" />}</tr></thead>
              <tbody>
                {rep.cases.slice(0, compact ? 6 : 14).map((c) => (
                  <tr key={c.kind + c.id} className="border-t border-theme-border-subtle">
                    <td className="max-w-[220px] truncate px-2 py-1.5 text-theme-text-primary" title={c.label}><span className="mr-1 rounded bg-theme-bg-secondary px-1 text-[9px] uppercase text-theme-text-muted">{c.kind}</span>{c.label}</td>
                    <td className="px-2 py-1.5 text-right">{c.lanes_affected}</td>
                    <td className={cn("px-2 py-1.5 text-right", c.lanes_cut && "font-semibold text-theme-red")}>{c.lanes_cut}</td>
                    <td className="px-2 py-1.5 text-right font-mono">{c.lanes_reroutable ? `+$${Math.round(c.best_added_cost).toLocaleString()} · +${Math.round(c.best_added_days)}d` : "none"}</td>
                    <td className="px-2 py-1.5 text-right"><span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-14 overflow-hidden rounded bg-theme-bg-secondary"><span className={cn("block h-full", c.fragility >= 60 ? "bg-theme-red" : c.fragility >= 30 ? "bg-theme-amber" : "bg-theme-green")} style={{ width: `${Math.min(100, c.fragility)}%` }} /></span><span className="w-8 text-right font-mono">{Math.round(c.fragility)}</span></span></td>
                    {onFail && <td className="px-2 py-1.5 text-right">{c.kind !== "lane" && <button type="button" onClick={() => onFail({ id: `audit-${c.id}-${Date.now()}`, kind: "simulation", title: `${c.label}: simulated outage (from resilience audit)`, description: `What-if from the resilience audit: ${c.label} is unavailable for 2 weeks.`, failed_node_ids: [c.id], failed_edge_ids: [], sources: [] })} className="rounded-full border border-theme-border-subtle px-2 py-0.5 text-[10px] font-semibold text-theme-text-secondary hover:border-theme-red hover:text-theme-red">Fail it</button>}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rep.narrative && <div className="prose prose-sm max-w-none rounded-theme-md border border-theme-border-subtle bg-theme-bg-secondary p-3 text-sm dark:prose-invert [&_li]:my-0 [&_ul]:my-1"><ReactMarkdown>{rep.narrative}</ReactMarkdown></div>}
        </div>
      )}
    </div>
  )
}
