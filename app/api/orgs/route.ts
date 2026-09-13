import { NextRequest, NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth-server"
import { supabaseServer } from "@/lib/supabase/server"

/** PATCH { orgId, name } — rename (owner). */
export async function PATCH(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "sign in" }, { status: 401 })
  const { orgId, name } = await req.json().catch(() => ({}))
  const { data: m } = await supabaseServer.from("org_members").select("role").eq("org_id", orgId).eq("user_id", user.id).maybeSingle()
  if (m?.role !== "owner") return NextResponse.json({ error: "owner only" }, { status: 403 })
  const { data, error } = await supabaseServer.from("orgs").update({ name: String(name).slice(0, 80) }).eq("id", orgId).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ org: data })
}
