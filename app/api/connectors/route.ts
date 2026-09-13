import { NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase/server"

/** GET ?supplyChainId · POST { userId, supplyChainId, name, kind, entity, config, schedule_minutes } · DELETE ?id */
export async function GET(req: NextRequest) {
  const sc = new URL(req.url).searchParams.get("supplyChainId"); if (!sc) return NextResponse.json({ error: "supplyChainId is required" }, { status: 400 })
  const { data, error } = await supabaseServer.from("connectors").select("id, name, kind, entity, schedule_minutes, enabled, last_sync_at, last_status, last_error, last_count, config").eq("supply_chain_id", sc).order("created_at")
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  // never echo secrets back to the browser
  return NextResponse.json({ connectors: (data ?? []).map((c) => ({ ...c, config: { ...c.config, headers: Object.fromEntries(Object.keys(c.config?.headers ?? {}).map((k) => [k, "••••"])) } })) })
}

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}))
  if (!b.userId || !b.supplyChainId || !b.name || !b.kind || !b.config?.url) return NextResponse.json({ error: "userId, supplyChainId, name, kind and config.url are required" }, { status: 400 })
  const { data, error } = await supabaseServer.from("connectors").insert({ supply_chain_id: b.supplyChainId, user_id: b.userId, name: b.name, kind: b.kind, entity: b.entity ?? "shipments", config: b.config, schedule_minutes: Number(b.schedule_minutes ?? 60) }).select("id").single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: data.id })
}

export async function DELETE(req: NextRequest) {
  const id = new URL(req.url).searchParams.get("id"); if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 })
  const { error } = await supabaseServer.from("connectors").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
