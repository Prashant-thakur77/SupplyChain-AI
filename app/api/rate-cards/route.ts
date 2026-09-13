import { NextRequest, NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth-server"
import { supabaseServer } from "@/lib/supabase/server"
import { RATE_CARD } from "@/lib/twin-enrich"

const MODES = ["sea", "air", "rail", "road"] as const

/** GET ?orgId → rate card (defaults filled). PUT { orgId, rows:[{mode, usd_per_km, km_per_day, fixed_days, min_usd, co2_g_per_tkm}] } (owner/approver). */
export async function GET(req: NextRequest) {
  const orgId = new URL(req.url).searchParams.get("orgId")
  if (!orgId) return NextResponse.json({ error: "orgId is required" }, { status: 400 })
  const { data } = await supabaseServer.from("rate_cards").select("*").eq("org_id", orgId)
  const by = new Map((data ?? []).map((r) => [r.mode, r]))
  return NextResponse.json({ rows: MODES.map((m) => by.get(m) ?? { mode: m, usd_per_km: RATE_CARD[m].usdPerKm, km_per_day: RATE_CARD[m].kmPerDay, fixed_days: RATE_CARD[m].fixedDays, min_usd: RATE_CARD[m].minUsd, co2_g_per_tkm: { sea: 16, rail: 28, road: 62, air: 602 }[m], is_default: true }) })
}

export async function PUT(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "sign in" }, { status: 401 })
  const { orgId, rows } = await req.json().catch(() => ({}))
  const { data: m } = await supabaseServer.from("org_members").select("role").eq("org_id", orgId).eq("user_id", user.id).maybeSingle()
  if (!m || !["owner", "approver"].includes(m.role)) return NextResponse.json({ error: "owner or approver only" }, { status: 403 })
  const clean = (rows ?? []).filter((r: any) => MODES.includes(r.mode)).map((r: any) => ({ org_id: orgId, mode: r.mode, usd_per_km: Number(r.usd_per_km), km_per_day: Number(r.km_per_day), fixed_days: Number(r.fixed_days ?? 0), min_usd: Number(r.min_usd ?? 0), co2_g_per_tkm: Number(r.co2_g_per_tkm ?? 0), updated_at: new Date().toISOString() }))
  const { error } = await supabaseServer.from("rate_cards").upsert(clean, { onConflict: "org_id,mode" })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
