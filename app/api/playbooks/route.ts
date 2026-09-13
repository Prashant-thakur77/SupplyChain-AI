import { NextRequest, NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth-server"
import { supabaseServer } from "@/lib/supabase/server"

const AGENT = (process.env.AGENT_SERVICE_URL ?? "http://localhost:8080").replace(/\/$/, "")

async function role(userId: string, orgId: string) { const { data } = await supabaseServer.from("org_members").select("role").eq("org_id", orgId).eq("user_id", userId).maybeSingle(); return data?.role ?? null }
const canEdit = (r: string | null) => r === "owner" || r === "approver" || r === "planner"

/** GET ?orgId → { playbooks, catalog } · POST { orgId, install: key } | { orgId, playbook } · PUT { id, ...fields } · DELETE ?id */
export async function GET(req: NextRequest) {
  const user = await getSessionUser(); if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const orgId = new URL(req.url).searchParams.get("orgId"); if (!orgId) return NextResponse.json({ error: "orgId required" }, { status: 400 })
  if (!(await role(user.id, orgId))) return NextResponse.json({ error: "forbidden" }, { status: 403 })
  const [{ data }, catalog] = await Promise.all([
    supabaseServer.from("playbooks").select("*").eq("org_id", orgId).order("created_at"),
    fetch(`${AGENT}/playbooks/catalog`, { headers: { "x-agent-secret": process.env.AGENT_SERVICE_SECRET ?? "" } }).then((r) => (r.ok ? r.json() : { playbooks: [] })).catch(() => ({ playbooks: [] })),
  ])
  return NextResponse.json({ playbooks: data ?? [], catalog: catalog.playbooks ?? [] })
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(); if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const b = await req.json().catch(() => ({}))
  if (!b.orgId) return NextResponse.json({ error: "orgId required" }, { status: 400 })
  if (!canEdit(await role(user.id, b.orgId))) return NextResponse.json({ error: "planners, approvers or owners only" }, { status: 403 })
  let row: any
  if (b.install) {
    const cat = await fetch(`${AGENT}/playbooks/catalog`, { headers: { "x-agent-secret": process.env.AGENT_SERVICE_SECRET ?? "" } }).then((r) => r.json()).catch(() => ({ playbooks: [] }))
    const p = (cat.playbooks ?? []).find((x: any) => x.key === b.install); if (!p) return NextResponse.json({ error: "unknown playbook" }, { status: 404 })
    row = { org_id: b.orgId, created_by: user.id, key: p.key, name: p.name, category: p.category, triggers: p.triggers, steps: p.steps, guidance: p.guidance, source: "builtin" }
  } else {
    const p = b.playbook ?? {}
    if (!p.name || !p.category) return NextResponse.json({ error: "name and category required" }, { status: 400 })
    row = { org_id: b.orgId, created_by: user.id, key: p.key ?? `custom-${Date.now().toString(36)}`, name: p.name, category: p.category, triggers: p.triggers ?? [], steps: p.steps ?? [], guidance: p.guidance ?? null, source: "custom" }
  }
  const { data, error } = await supabaseServer.from("playbooks").upsert(row, { onConflict: "org_id,key" }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ playbook: data })
}

export async function PUT(req: NextRequest) {
  const user = await getSessionUser(); if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const b = await req.json().catch(() => ({}))
  const { data: p } = await supabaseServer.from("playbooks").select("org_id").eq("id", b.id).maybeSingle(); if (!p) return NextResponse.json({ error: "not found" }, { status: 404 })
  if (!canEdit(await role(user.id, p.org_id))) return NextResponse.json({ error: "forbidden" }, { status: 403 })
  const patch: any = { updated_at: new Date().toISOString() }
  for (const k of ["name", "category", "triggers", "steps", "guidance", "enabled"]) if (b[k] !== undefined) patch[k] = b[k]
  const { data, error } = await supabaseServer.from("playbooks").update(patch).eq("id", b.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ playbook: data })
}

export async function DELETE(req: NextRequest) {
  const user = await getSessionUser(); if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const id = new URL(req.url).searchParams.get("id"); if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
  const { data: p } = await supabaseServer.from("playbooks").select("org_id").eq("id", id).maybeSingle(); if (!p) return NextResponse.json({ error: "not found" }, { status: 404 })
  if (!canEdit(await role(user.id, p.org_id))) return NextResponse.json({ error: "forbidden" }, { status: 403 })
  await supabaseServer.from("playbooks").delete().eq("id", id)
  return NextResponse.json({ ok: true })
}
