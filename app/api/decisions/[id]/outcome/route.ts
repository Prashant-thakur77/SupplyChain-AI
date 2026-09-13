import { NextRequest, NextResponse } from "next/server"
import { canApprove, getSessionUser, roleForChain } from "@/lib/auth-server"
import { agentClient } from "@/lib/agent-client"
import { supabaseServer } from "@/lib/supabase/server"

/** GET → { outcome } · POST { actualAddedCost, actualAddedDays, outcome, notes } — records what really happened (owner/approver). */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const { data } = await supabaseServer.from("decision_outcomes").select("*").eq("decision_id", id).maybeSingle()
  return NextResponse.json({ outcome: data ?? null })
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const b = await req.json().catch(() => ({}))
  const { data: d } = await supabaseServer.from("decisions").select("id, supply_chain_id, user_id, title, status, chosen_option_id, options").eq("id", id).maybeSingle()
  if (!d) return NextResponse.json({ error: "decision not found" }, { status: 404 })
  if (d.status !== "approved") return NextResponse.json({ error: "outcomes are recorded on approved decisions" }, { status: 400 })
  const session = await getSessionUser(); const actor = session?.id ?? (b.actorUserId as string | undefined)
  if (!actor) return NextResponse.json({ error: "sign in to record outcomes" }, { status: 401 })
  if (!canApprove(await roleForChain(actor, d.supply_chain_id))) return NextResponse.json({ error: "owners/approvers only" }, { status: 403 })
  const chosen = (d.options as any[]).find((o) => o.id === d.chosen_option_id)
  const row = { decision_id: id, supply_chain_id: d.supply_chain_id, recorded_by: actor, option_id: d.chosen_option_id, estimated_added_cost: chosen?.added_cost ?? null, estimated_added_days: chosen?.added_days ?? null,
    actual_added_cost: b.actualAddedCost != null ? Number(b.actualAddedCost) : null, actual_added_days: b.actualAddedDays != null ? Number(b.actualAddedDays) : null, outcome: b.outcome ?? "resolved", notes: b.notes ?? null }
  const { data, error } = await supabaseServer.from("decision_outcomes").upsert(row, { onConflict: "decision_id" }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await supabaseServer.from("audit_logs").insert({ user_id: actor, actor: "Outcome", status: "success", action: `Outcome recorded for "${d.title}": ${row.outcome}${row.actual_added_cost != null ? ` · actual +$${row.actual_added_cost}` : ""}${row.actual_added_days != null ? ` · +${row.actual_added_days}d` : ""}`, details: row }).then(() => undefined, () => undefined)
  agentClient.post("/memory", { supply_chain_id: d.supply_chain_id, user_id: actor, title: `${d.title} — actual outcome (${row.outcome})`, status: "approved", option_label: chosen?.label ?? null, added_cost: row.actual_added_cost, added_days: row.actual_added_days })
    .catch((e) => console.warn("[outcome] memory store failed:", (e as Error).message))
  return NextResponse.json({ outcome: data })
}
