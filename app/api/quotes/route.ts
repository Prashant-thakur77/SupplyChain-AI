import { NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase/server"

/** Carrier quotes. GET ?supplyChainId · POST { userId, supplyChainId, quotes:[{origin_node_id,destination_node_id,mode,carrier,cost,transit_days,valid_until}] } (append) · DELETE ?id */
export async function GET(req: NextRequest) {
  const sc = new URL(req.url).searchParams.get("supplyChainId")
  if (!sc) return NextResponse.json({ error: "supplyChainId is required" }, { status: 400 })
  const { data } = await supabaseServer.from("carrier_quotes").select("*").eq("supply_chain_id", sc).order("created_at", { ascending: false })
  return NextResponse.json({ quotes: data ?? [] })
}
export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}))
  if (!b.userId || !b.supplyChainId || !Array.isArray(b.quotes)) return NextResponse.json({ error: "userId, supplyChainId, quotes[] required" }, { status: 400 })
  const rows = b.quotes.filter((q: any) => q.origin_node_id && q.destination_node_id && q.mode && Number(q.cost) > 0).map((q: any) => ({ supply_chain_id: b.supplyChainId, user_id: b.userId, origin_node_id: q.origin_node_id, destination_node_id: q.destination_node_id, mode: String(q.mode).toLowerCase(), carrier: q.carrier ?? null, cost: Number(q.cost), transit_days: Number(q.transit_days ?? 0), valid_until: q.valid_until || null }))
  const { data, error } = rows.length ? await supabaseServer.from("carrier_quotes").insert(rows).select() : { data: [], error: null }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ quotes: data, inserted: rows.length })
}
export async function DELETE(req: NextRequest) {
  const id = new URL(req.url).searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
  await supabaseServer.from("carrier_quotes").delete().eq("id", id)
  return NextResponse.json({ ok: true })
}
