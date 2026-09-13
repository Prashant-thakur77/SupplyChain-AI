import { NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase/server"

/** GET ?supplyChainId · POST { userId, supplyChainId, contracts:[...] } · DELETE ?id */
export async function GET(req: NextRequest) {
  const sc = new URL(req.url).searchParams.get("supplyChainId"); if (!sc) return NextResponse.json({ error: "supplyChainId is required" }, { status: 400 })
  const { data, error } = await supabaseServer.from("contracts").select("*").eq("supply_chain_id", sc).order("created_at")
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ contracts: data ?? [] })
}

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}))
  if (!b.userId || !b.supplyChainId || !Array.isArray(b.contracts)) return NextResponse.json({ error: "userId, supplyChainId, contracts[] required" }, { status: 400 })
  const rows = b.contracts.filter((c: any) => c.counterparty).map((c: any) => ({ supply_chain_id: b.supplyChainId, user_id: b.userId, counterparty: String(c.counterparty), kind: ["customer", "supplier", "carrier"].includes(c.kind) ? c.kind : "customer", node_id: c.node_id ?? null,
    lead_time_commit_days: c.lead_time_commit_days ?? null, grace_days: Number(c.grace_days ?? 0), penalty_per_day_usd: Number(c.penalty_per_day_usd ?? 0), penalty_cap_usd: c.penalty_cap_usd ?? null, service_level_pct: c.service_level_pct ?? null, expires_at: c.expires_at || null, notes: c.notes ?? null, raw_text: c.raw_text ?? null }))
  const { data, error } = rows.length ? await supabaseServer.from("contracts").insert(rows).select() : { data: [], error: null }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ contracts: data, inserted: rows.length })
}

export async function DELETE(req: NextRequest) {
  const id = new URL(req.url).searchParams.get("id"); if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
  await supabaseServer.from("contracts").delete().eq("id", id)
  return NextResponse.json({ ok: true })
}
