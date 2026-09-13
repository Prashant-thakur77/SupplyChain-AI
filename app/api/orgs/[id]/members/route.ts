import { NextRequest, NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth-server"
import { logAudit } from "@/lib/audit-logger"
import { supabaseServer } from "@/lib/supabase/server"

async function myRole(userId: string, orgId: string) {
  const { data } = await supabaseServer.from("org_members").select("role").eq("org_id", orgId).eq("user_id", userId).maybeSingle()
  return data?.role as string | undefined
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const user = await getSessionUser()
  if (!user || !(await myRole(user.id, id))) return NextResponse.json({ error: "forbidden" }, { status: 403 })
  const { data } = await supabaseServer.from("org_members").select("user_id, role, invited_email, created_at, users(email, organisation_name)").eq("org_id", id).order("created_at")
  return NextResponse.json({ members: (data ?? []).map((m: any) => ({ user_id: m.user_id, role: m.role, email: m.users?.email ?? m.invited_email, since: m.created_at })) })
}

/** Invite by email (owner). Creates or finds the auth user and adds the membership; Supabase sends the invite mail when SMTP is configured. */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const user = await getSessionUser()
  if (!user || (await myRole(user.id, id)) !== "owner") return NextResponse.json({ error: "owner only" }, { status: 403 })
  const { email, role = "planner" } = await req.json().catch(() => ({}))
  if (!email || !["approver", "planner", "viewer", "owner"].includes(role)) return NextResponse.json({ error: "email and a valid role are required" }, { status: 400 })
  let uid: string | null = null
  const { data: existing } = await supabaseServer.from("users").select("id").eq("email", email).maybeSingle()
  if (existing) uid = existing.id
  else {
    const inv = await supabaseServer.auth.admin.inviteUserByEmail(email).catch(() => null)
    uid = inv?.data?.user?.id ?? null
    if (!uid) { const created = await supabaseServer.auth.admin.createUser({ email, email_confirm: true }); uid = created.data.user?.id ?? null }
    if (uid) await supabaseServer.from("users").upsert({ id: uid, email }, { onConflict: "id" })
  }
  if (!uid) return NextResponse.json({ error: "could not create the user" }, { status: 500 })
  const { error } = await supabaseServer.from("org_members").upsert({ org_id: id, user_id: uid, role, invited_email: email }, { onConflict: "org_id,user_id" })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await logAudit({ userId: user.id, action: "member_invited", details: { status: "success", summary: `Invited ${email} as ${role}`, metadata: { orgId: id } } }).catch(() => undefined)
  return NextResponse.json({ ok: true, user_id: uid })
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const user = await getSessionUser()
  if (!user || (await myRole(user.id, id)) !== "owner") return NextResponse.json({ error: "owner only" }, { status: 403 })
  const { userId, role, remove } = await req.json().catch(() => ({}))
  if (remove) { await supabaseServer.from("org_members").delete().eq("org_id", id).eq("user_id", userId).neq("user_id", user.id); return NextResponse.json({ ok: true }) }
  if (!["approver", "planner", "viewer", "owner"].includes(role)) return NextResponse.json({ error: "invalid role" }, { status: 400 })
  await supabaseServer.from("org_members").update({ role }).eq("org_id", id).eq("user_id", userId)
  return NextResponse.json({ ok: true })
}
