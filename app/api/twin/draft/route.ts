import { NextRequest, NextResponse } from "next/server"
import { agentClient, agentErrorResponse } from "@/lib/agent-client"
import { geocodeNodes } from "@/lib/geocode"
import { draftToRf, type TwinDraft } from "@/lib/twin-draft"
import { enrichEdges } from "@/lib/twin-enrich"

export const maxDuration = 120

/** Text-to-twin: description → Strands twin_builder → React Flow nodes/edges → geocode + estimate lanes. */
export async function POST(req: NextRequest) {
  const { description, userId } = await req.json().catch(() => ({}))
  if (!description || String(description).trim().length < 20) return NextResponse.json({ error: "Describe the supply chain in at least a sentence." }, { status: 400 })
  try {
    const draft = await agentClient.post<TwinDraft>("/twin/draft", { description: String(description).slice(0, 6000), user_id: userId ?? "anonymous" })
    const rf = draftToRf(draft)
    const geo = await geocodeNodes(rf.nodes.map((n) => ({ id: n.id, name: n.data.label, address: n.data.address, country: n.data.country, lat: n.data.lat, lng: n.data.lng })))
    const coords = new Map(geo.nodes.map((n) => [n.id, n]))
    const nodes = rf.nodes.map((n) => { const g = coords.get(n.id); return g && g.lat != null ? { ...n, data: { ...n.data, lat: g.lat, lng: g.lng, country: n.data.country ?? g.country, location: { lat: g.lat, lng: g.lng, country: n.data.country ?? g.country } } } : n })
    const est = enrichEdges(nodes.map((n) => ({ id: n.id, lat: n.data.lat, lng: n.data.lng })), rf.edges.map((e) => ({ id: e.id, source: e.source, target: e.target, mode: e.data.mode, cost: e.data.cost, transitTime: e.data.transitTime })))
    const estMap = new Map(est.edges.map((e) => [e.id, e]))
    const edges = rf.edges.map((e) => { const x = estMap.get(e.id)!; return { ...e, data: { ...e.data, cost: x.cost, transitTime: x.transitTime, estimated: !!x.estimated } } })
    return NextResponse.json({ name: draft.name, summary: draft.summary, assumptions: draft.assumptions, questions: draft.questions, nodes, edges, notes: [...geo.unresolved.map((u) => `Could not geocode "${u}".`), ...est.notes], geocoded: geo.resolved, estimatedLanes: est.edges.filter((e) => e.estimated).length })
  } catch (e) {
    const { body, status } = agentErrorResponse(e)
    return NextResponse.json(body, { status })
  }
}
