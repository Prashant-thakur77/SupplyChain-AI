import { NextRequest, NextResponse } from "next/server"
import { canApprove, getSessionUser, roleForChain } from "@/lib/auth-server"
import { applyDecision } from "@/lib/decisions-server"
import { supabaseServer } from "@/lib/supabase/server"

const ALLOWED = new Set(["approved", "rejected", "snoozed", "expired"])

/** Decide: { status: approved|rejected|snoozed, chosenOptionId?, snoozeHours? } — requires a signed-in owner/approver. */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const body = await req.json().catch(() => ({}))
  if (!ALLOWED.has(body.status)) return NextResponse.json({ error: "invalid status" }, { status: 400 })
  const { data: existing } = await supabaseServer.from("decisions").select("supply_chain_id").eq("id", id).maybeSingle()
  if (!existing) return NextResponse.json({ error: "decision not found" }, { status: 404 })
  const session = await getSessionUser()
  const actor = session?.id ?? (body.actorUserId as string | undefined)
  if (!actor) return NextResponse.json({ error: "sign in to act on decisions" }, { status: 401 })
  const role = await roleForChain(actor, existing.supply_chain_id)
  if (!canApprove(role)) return NextResponse.json({ error: `your role (${role ?? "none"}) cannot approve decisions on this supply chain` }, { status: 403 })
  const r = await applyDecision(id, body.status, actor, body.chosenOptionId ?? null, Number(body.snoozeHours) || 24)
  if ("error" in r && r.error) return NextResponse.json({ error: r.error, decision: (r as any).decision }, { status: r.status })
  return NextResponse.json({ decision: r.decision })
}
