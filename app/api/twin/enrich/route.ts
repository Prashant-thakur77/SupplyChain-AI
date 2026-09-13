import { NextRequest, NextResponse } from "next/server"
import { geocodeNodes } from "@/lib/geocode"
import { enrichEdges } from "@/lib/twin-enrich"

export const maxDuration = 60

/** Enrich a draft twin before saving: geocode nodes without coordinates, estimate missing lane cost/days.
 *  Body: { nodes: [{id, name|label, address?, country?, lat?, lng?}], edges: [{id, source, target, mode?, cost?, transitTime?}] } */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const nodes: any[] = Array.isArray(body.nodes) ? body.nodes : []
  const edges: any[] = Array.isArray(body.edges) ? body.edges : []
  if (!nodes.length) return NextResponse.json({ error: "nodes are required" }, { status: 400 })
  const geo = await geocodeNodes(nodes.slice(0, 200))
  const est = enrichEdges(geo.nodes, edges)
  return NextResponse.json({
    nodes: geo.nodes, edges: est.edges,
    notes: [...(geo.resolved ? [`Geocoded ${geo.resolved} node${geo.resolved === 1 ? "" : "s"} without coordinates.`] : []), ...geo.unresolved.map((u) => `Could not geocode "${u}" — set lat/lng manually.`), ...est.notes],
    geocoded: geo.resolved, unresolved: geo.unresolved, estimatedLanes: est.edges.filter((e: any) => e.estimated).length,
  })
}
