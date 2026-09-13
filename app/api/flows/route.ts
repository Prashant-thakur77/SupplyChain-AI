import { NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase/server"
import { requireChainAccess, requireRowAccess } from "@/lib/auth-server"

/** Flows CRUD. GET ?supplyChainId · POST {userId, supplyChainId, flows:[...]} (replace all) · DELETE ?id */
export async function GET(req: NextRequest) {
  const sc = new URL(req.url).searchParams.get("supplyChainId")
  const g = await requireChainAccess(sc); if ("error" in g) return NextResponse.json({ error: g.error }, { status: g.status })
  const { data, error } = await supabaseServer.from("flows").select("*").eq("supply_chain_id", sc).order("created_at")
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ flows: data ?? [] })
}

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}))
  if (!b.userId || !b.supplyChainId || !Array.isArray(b.flows)) return NextResponse.json({ error: "userId, supplyChainId and flows[] are required" }, { status: 400 })
  const g = await requireChainAccess(b.supplyChainId, true); if ("error" in g) return NextResponse.json({ error: g.error }, { status: g.status })
  const rows = b.flows.filter((f: any) => f.origin_node_id && f.destination_node_id).map((f: any) => ({
    supply_chain_id: b.supplyChainId, user_id: b.userId, origin_node_id: f.origin_node_id, destination_node_id: f.destination_node_id, product: f.product ?? null,
    units_per_week: Number(f.units_per_week ?? 0), value_per_unit: Number(f.value_per_unit ?? 0), lead_time_days: f.lead_time_days != null ? Number(f.lead_time_days) : null,
    penalty_per_day: Number(f.penalty_per_day ?? 0), inventory_days: Number(f.inventory_days ?? 0), active: f.active ?? true,
  }))
  await supabaseServer.from("flows").delete().eq("supply_chain_id", b.supplyChainId).eq("user_id", b.userId)
  const { data, error } = rows.length ? await supabaseServer.from("flows").insert(rows).select() : { data: [], error: null }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ flows: data })
}
