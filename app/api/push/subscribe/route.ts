import { NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase/server"
import { getSessionUser } from "@/lib/auth-server"

/** GET → { publicKey } · POST { subscription } · DELETE { endpoint }. Session-cookie authenticated. */
export async function GET() { return NextResponse.json({ publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null }) }

export async function POST(req: NextRequest) {
  const user = await getSessionUser(); if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const { subscription } = await req.json().catch(() => ({}))
  if (!subscription?.endpoint || !subscription?.keys) return NextResponse.json({ error: "subscription required" }, { status: 400 })
  const { error } = await supabaseServer.from("push_subscriptions").upsert({ user_id: user.id, endpoint: subscription.endpoint, keys: subscription.keys, user_agent: req.headers.get("user-agent") }, { onConflict: "endpoint" })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const user = await getSessionUser(); if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const { endpoint } = await req.json().catch(() => ({}))
  if (endpoint) await supabaseServer.from("push_subscriptions").delete().eq("user_id", user.id).eq("endpoint", endpoint)
  return NextResponse.json({ ok: true })
}
