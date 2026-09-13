import { NextRequest, NextResponse } from "next/server"
import { logAudit } from "@/lib/audit-logger"
import { supabaseServer } from "@/lib/supabase/server"

/** Autonomy policies. GET ?userId → all policies for the user's twins. PUT { userId, supplyChainId, ...fields } → upsert. */
export async function GET(req: NextRequest) {
  const userId = new URL(req.url).searchParams.get("userId")
  if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 })
  const [chains, policies] = await Promise.all([
    supabaseServer.from("supply_chains").select("supply_chain_id, name").eq("user_id", userId),
    supabaseServer.from("autonomy_policies").select("*").eq("user_id", userId),
  ])
  const byId = new Map((policies.data ?? []).map((p) => [p.supply_chain_id, p]))
  return NextResponse.json({
    twins: (chains.data ?? []).map((c) => ({ id: c.supply_chain_id, name: c.name, policy: byId.get(c.supply_chain_id) ?? { supply_chain_id: c.supply_chain_id, auto_approve: false, max_added_cost: 2000, max_added_days: 5, min_confidence: 0.8, expire_hours: 48, webhook_url: null, carbon_weight: 0, carbon_price: 100 } })),
  })
}

export async function PUT(req: NextRequest) {
  const b = await req.json().catch(() => ({}))
  if (!b.userId || !b.supplyChainId) return NextResponse.json({ error: "userId and supplyChainId are required" }, { status: 400 })
  const row = {
    supply_chain_id: b.supplyChainId, user_id: b.userId, auto_approve: !!b.auto_approve,
    max_added_cost: Math.max(0, Number(b.max_added_cost ?? 2000)), max_added_days: Math.max(0, Number(b.max_added_days ?? 5)),
    min_confidence: Math.min(1, Math.max(0, Number(b.min_confidence ?? 0.8))), expire_hours: Math.max(1, Math.min(720, Number(b.expire_hours ?? 48))),
    carbon_weight: Math.min(1, Math.max(0, Number(b.carbon_weight ?? 0))), carbon_price: Math.max(0, Number(b.carbon_price ?? 100)),
    webhook_url: b.webhook_url ? String(b.webhook_url).slice(0, 500) : null, updated_at: new Date().toISOString(),
  }
  const { data, error } = await supabaseServer.from("autonomy_policies").upsert(row, { onConflict: "supply_chain_id" }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await logAudit({ userId: b.userId, action: "policy_updated", details: { status: "success", summary: `Autonomy policy updated: auto-approve ${row.auto_approve ? "on" : "off"}, ≤ $${row.max_added_cost}, ≤ ${row.max_added_days}d`, metadata: { supplyChainId: b.supplyChainId } } }).catch(() => undefined)
  return NextResponse.json({ policy: data })
}
