// Data-quality lint for a twin. Bad twins make bad decisions; surface problems before Sentinel and routing rely on them.
import type { Edge, Node } from "reactflow"

export type LintLevel = "error" | "warn" | "info"
export interface LintIssue { level: LintLevel; code: string; message: string; nodeId?: string; edgeId?: string; fix?: string }
export interface LintResult { score: number; issues: LintIssue[]; counts: Record<LintLevel, number> }

export function lintTwin(nodes: Node[], edges: Edge[]): LintResult {
  const issues: LintIssue[] = []
  const real = nodes.filter((n) => n.type !== "group")
  const ids = new Set(real.map((n) => n.id))
  const labels = new Map<string, string[]>()
  for (const n of real) {
    const label = String(n.data?.label ?? "").trim()
    if (!label) issues.push({ level: "error", code: "no-label", message: `Site ${n.id} has no name.`, nodeId: n.id, fix: "Give it a name so alerts and decisions read correctly." })
    else labels.set(label.toLowerCase(), [...(labels.get(label.toLowerCase()) ?? []), n.id])
    const lat = n.data?.lat ?? n.data?.location?.lat, lng = n.data?.lng ?? n.data?.location?.lng
    if (typeof lat !== "number" || typeof lng !== "number") issues.push({ level: "warn", code: "no-coords", message: `${label || n.id} has no coordinates — weather scans and the map skip it.`, nodeId: n.id, fix: "Add a city/address; the enrich step geocodes it." })
    if (!n.data?.country) issues.push({ level: "info", code: "no-country", message: `${label || n.id} has no country — news scans are less targeted.`, nodeId: n.id })
  }
  for (const [label, dup] of labels) if (dup.length > 1) issues.push({ level: "warn", code: "duplicate-label", message: `${dup.length} sites share the name "${label}".`, fix: "Rename so decisions are unambiguous." })
  const touched = new Set<string>()
  for (const e of edges) {
    if (e.type === "route") continue
    if (!ids.has(e.source) || !ids.has(e.target)) { issues.push({ level: "error", code: "dangling-lane", message: `Lane ${e.id} references a missing site.`, edgeId: e.id }); continue }
    touched.add(e.source); touched.add(e.target)
    const cost = Number(e.data?.cost ?? 0), days = Number(e.data?.transitTime ?? 0)
    if (!(cost > 0)) issues.push({ level: "warn", code: "zero-cost", message: `Lane ${e.source} → ${e.target} has no cost — the router would treat it as free.`, edgeId: e.id, fix: "Set a cost or let the enrich step estimate it from distance." })
    if (!(days > 0)) issues.push({ level: "warn", code: "zero-days", message: `Lane ${e.source} → ${e.target} has no transit time.`, edgeId: e.id })
    if (e.source === e.target) issues.push({ level: "error", code: "self-loop", message: `Lane ${e.id} starts and ends at the same site.`, edgeId: e.id })
  }
  for (const n of real) if (!touched.has(n.id)) issues.push({ level: "warn", code: "orphan", message: `${n.data?.label ?? n.id} has no lanes — it cannot be part of any route.`, nodeId: n.id, fix: "Connect it, or remove it." })
  if (real.length && edges.filter((e) => e.type !== "route").length === 0) issues.push({ level: "error", code: "no-lanes", message: "The twin has no lanes at all." })
  const counts = { error: issues.filter((i) => i.level === "error").length, warn: issues.filter((i) => i.level === "warn").length, info: issues.filter((i) => i.level === "info").length }
  const score = Math.max(0, Math.round(100 - counts.error * 25 - counts.warn * 6 - counts.info * 1))
  return { score, issues, counts }
}
