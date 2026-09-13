import { NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase/server"
import { getProvider } from "@/lib/tracking/providers"
import { pollShipments } from "@/lib/tracking/poll"
import { requireChainAccess, requireRowAccess } from "@/lib/auth-server"

/** GET ?supplyChainId[&poll=1] · POST { userId, supplyChainId, shipments:[{reference, origin_node_id, destination_node_id, mode, carrier, etd, planned_eta, value_usd}] } (upsert by reference) */
export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams
  const sc = sp.get("supplyChainId")
  const g = await requireChainAccess(sc); if ("error" in g) return NextResponse.json({ error: g.error }, { status: g.status })
  if (sp.get("poll") === "1") await pollShipments(sc!)
  const { data, error } = await supabaseServer.from("shipments").select("*").eq("supply_chain_id", sc).order("planned_eta")
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ shipments: data ?? [], provider: getProvider().name })
}

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}))
  if (!b.userId || !b.supplyChainId || !Array.isArray(b.shipments)) return NextResponse.json({ error: "userId, supplyChainId, shipments[] required" }, { status: 400 })
  const g = await requireChainAccess(b.supplyChainId, true); if ("error" in g) return NextResponse.json({ error: g.error }, { status: g.status })
  const rows = b.shipments.filter((s: any) => s.reference && s.origin_node_id && s.destination_node_id).map((s: any) => ({
    supply_chain_id: b.supplyChainId, user_id: b.userId, reference: String(s.reference), origin_node_id: s.origin_node_id, destination_node_id: s.destination_node_id, mode: s.mode ?? "sea", carrier: s.carrier ?? null,
    etd: s.etd || null, planned_eta: s.planned_eta || null, current_eta: s.planned_eta || null, value_usd: Number(s.value_usd ?? 0), status: s.etd && new Date(s.etd) < new Date() ? "in_transit" : "planned", updated_at: new Date().toISOString(),
  }))
  const { data, error } = rows.length ? await supabaseServer.from("shipments").upsert(rows, { onConflict: "supply_chain_id,reference" }).select() : { data: [], error: null }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ shipments: data, upserted: rows.length })
}
