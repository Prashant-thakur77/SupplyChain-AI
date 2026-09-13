// Browser helper: send React Flow nodes/edges to /api/twin/enrich and merge the results back.
import type { Edge, Node } from "reactflow"

export interface EnrichSummary { notes: string[]; geocoded: number; unresolved: string[]; estimatedLanes: number }

export async function enrichRfTwin(nodes: Node[], edges: Edge[]): Promise<{ nodes: Node[]; edges: Edge[]; summary: EnrichSummary }> {
  const res = await fetch("/api/twin/enrich", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({
      nodes: nodes.map((n) => ({ id: n.id, name: n.data?.label, address: n.data?.address, country: n.data?.country, lat: n.data?.lat ?? null, lng: n.data?.lng ?? null })),
      edges: edges.map((e) => ({ id: e.id, source: e.source, target: e.target, mode: e.data?.mode, cost: e.data?.cost, transitTime: e.data?.transitTime })),
    }),
  })
  const j = await res.json()
  if (!res.ok) throw new Error(j.error ?? `Enrich failed (${res.status})`)
  const geo = new Map<string, any>(j.nodes.map((n: any) => [n.id, n]))
  const est = new Map<string, any>(j.edges.map((e: any) => [e.id, e]))
  return {
    nodes: nodes.map((n) => { const g = geo.get(n.id); return g && g.lat != null ? { ...n, data: { ...n.data, lat: g.lat, lng: g.lng, country: n.data?.country ?? g.country, location: { lat: g.lat, lng: g.lng, country: n.data?.country ?? g.country } } } : n }),
    edges: edges.map((e) => { const x = est.get(e.id); return x ? { ...e, data: { ...e.data, cost: x.cost ?? e.data?.cost, transitTime: x.transitTime ?? e.data?.transitTime, estimated: !!x.estimated } } : e }),
    summary: { notes: j.notes ?? [], geocoded: j.geocoded ?? 0, unresolved: j.unresolved ?? [], estimatedLanes: j.estimatedLanes ?? 0 },
  }
}
