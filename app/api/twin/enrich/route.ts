import { NextRequest, NextResponse } from "next/server"
import { geocodeNodes } from "@/lib/geocode"
import { enrichEdges, type RateCard } from "@/lib/twin-enrich"
import { supabaseServer } from "@/lib/supabase/server"

async function orgRateCard(supplyChainId?: string, orgId?: string): Promise<RateCard | undefined> {
  let org = orgId
  if (!org && supplyChainId) { const { data } = await supabaseServer.from("supply_chains").select("org_id").eq("supply_chain_id", supplyChainId).maybeSingle(); org = data?.org_id ?? undefined }
  if (!org) return undefined
  const { data } = await supabaseServer.from("rate_cards").select("*").eq("org_id", org)
  if (!data?.length) return undefined
  return Object.fromEntries(data.map((r) => [r.mode, { usdPerKm: Number(r.usd_per_km), kmPerDay: Number(r.km_per_day), fixedDays: Number(r.fixed_days), minUsd: Number(r.min_usd) }]))
}

export const maxDuration = 60

/** Enrich a draft twin before saving: geocode nodes without coordinates, estimate missing lane cost/days.
 *  Body: { nodes: [{id, name|label, address?, country?, lat?, lng?}], edges: [{id, source, target, mode?, cost?, transitTime?}] } */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const nodes: any[] = Array.isArray(body.nodes) ? body.nodes : []
  const edges: any[] = Array.isArray(body.edges) ? body.edges : []
  if (!nodes.length) return NextResponse.json({ error: "nodes are required" }, { status: 400 })
  const geo = await geocodeNodes(nodes.slice(0, 200))
  const est = enrichEdges(geo.nodes, edges, await orgRateCard(body.supplyChainId, body.orgId))
  return NextResponse.json({
    nodes: geo.nodes, edges: est.edges,
    notes: [...(geo.resolved ? [`Geocoded ${geo.resolved} node${geo.resolved === 1 ? "" : "s"} without coordinates.`] : []), ...geo.unresolved.map((u) => `Could not geocode "${u}" — set lat/lng manually.`), ...est.notes],
    geocoded: geo.resolved, unresolved: geo.unresolved, estimatedLanes: est.edges.filter((e: any) => e.estimated).length,
  })
}
