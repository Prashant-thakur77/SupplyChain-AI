import { createHash, randomBytes } from "node:crypto"
import { NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase/server"
import { getSessionUser } from "@/lib/auth-server"

async function orgRole(userId: string, orgId: string) {
  const { data } = await supabaseServer.from("org_members").select("role").eq("org_id", orgId).eq("user_id", userId).maybeSingle()
  return data?.role ?? null
}

/** GET ?orgId · POST { orgId, name } → { key } (shown once) · DELETE ?id — owners/approvers only. */
export async function GET(req: NextRequest) {
  const user = await getSessionUser(); if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const orgId = new URL(req.url).searchParams.get("orgId"); if (!orgId) return NextResponse.json({ error: "orgId required" }, { status: 400 })
  if (!(await orgRole(user.id, orgId))) return NextResponse.json({ error: "forbidden" }, { status: 403 })
  const { data } = await supabaseServer.from("api_keys").select("id, name, prefix, revoked, last_used_at, created_at").eq("org_id", orgId).order("created_at", { ascending: false })
  return NextResponse.json({ keys: data ?? [] })
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(); if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const { orgId, name } = await req.json().catch(() => ({}))
  if (!orgId || !name) return NextResponse.json({ error: "orgId and name required" }, { status: 400 })
  const role = await orgRole(user.id, orgId); if (role !== "owner" && role !== "approver") return NextResponse.json({ error: "owners/approvers only" }, { status: 403 })
  const key = `sca_${randomBytes(24).toString("base64url")}`
  const { error } = await supabaseServer.from("api_keys").insert({ org_id: orgId, created_by: user.id, name, key_hash: createHash("sha256").update(key).digest("hex"), prefix: key.slice(0, 10) })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ key })
}

export async function DELETE(req: NextRequest) {
  const user = await getSessionUser(); if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const id = new URL(req.url).searchParams.get("id"); if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
  const { data: k } = await supabaseServer.from("api_keys").select("org_id").eq("id", id).maybeSingle(); if (!k) return NextResponse.json({ error: "not found" }, { status: 404 })
  const role = await orgRole(user.id, k.org_id); if (role !== "owner" && role !== "approver") return NextResponse.json({ error: "owners/approvers only" }, { status: 403 })
  await supabaseServer.from("api_keys").update({ revoked: true }).eq("id", id)
  return NextResponse.json({ ok: true })
}
