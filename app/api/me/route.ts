import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth-server"
import { supabaseServer } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

/** Current user, their orgs and roles. */
export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ user: null, orgs: [] })
  const { data } = await supabaseServer.from("org_members").select("role, orgs(id, name)").eq("user_id", user.id)
  return NextResponse.json({ user, orgs: (data ?? []).map((m: any) => ({ id: m.orgs?.id, name: m.orgs?.name, role: m.role })) })
}
