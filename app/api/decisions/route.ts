import { NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase/server"

/** Server-side listing (service role). Used by the header badge poller and the demo. Query: userId, status */
export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams
  const userId = sp.get("userId")
  const status = sp.get("status")
  if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 })
  let q = supabaseServer.from("decisions").select("*, route_plans(*)").eq("user_id", userId).order("created_at", { ascending: false }).limit(100)
  if (status) q = q.in("status", status.split(","))
  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ decisions: data ?? [] })
}
