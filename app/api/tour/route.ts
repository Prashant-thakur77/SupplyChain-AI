import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth-server"
import { supabaseServer } from "@/lib/supabase/server"

/** GET → { done: boolean } · POST → marks the tour done for the session user · DELETE → resets it. */
export async function GET() {
  const user = await getSessionUser(); if (!user) return NextResponse.json({ done: true })
  const { data } = await supabaseServer.from("users").select("tour_completed_at").eq("id", user.id).maybeSingle()
  return NextResponse.json({ done: !!data?.tour_completed_at, exists: !!data })
}
export async function POST() {
  const user = await getSessionUser(); if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const now = new Date().toISOString()
  const { error } = await supabaseServer.from("users").upsert({ id: user.id, email: user.email ?? "", tour_completed_at: now, updated_at: now }, { onConflict: "id" })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
export async function DELETE() {
  const user = await getSessionUser(); if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  await supabaseServer.from("users").update({ tour_completed_at: null }).eq("id", user.id)
  return NextResponse.json({ ok: true })
}
