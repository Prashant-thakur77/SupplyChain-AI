import { NextRequest, NextResponse } from "next/server"
import { logAudit } from "@/lib/audit-logger"
import { supabaseServer } from "@/lib/supabase/server"

const ALLOWED = new Set(["approved", "rejected", "snoozed", "expired"])

/** Decide: { status: approved|rejected|snoozed, chosenOptionId?, snoozeHours? } */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const body = await req.json().catch(() => ({}))
  const status: string = body.status
  if (!ALLOWED.has(status)) return NextResponse.json({ error: "invalid status" }, { status: 400 })

  const { data: existing, error: readErr } = await supabaseServer.from("decisions").select("*").eq("id", id).single()
  if (readErr || !existing) return NextResponse.json({ error: "decision not found" }, { status: 404 })

  const options: any[] = existing.options ?? []
  const chosenId: string | null = status === "approved" ? body.chosenOptionId ?? existing.recommended_option_id : body.chosenOptionId ?? null
  if (status === "approved" && !options.some((o) => o.id === chosenId)) return NextResponse.json({ error: "chosenOptionId not in options" }, { status: 400 })
  const chosen = options.find((o) => o.id === chosenId)

  const update: Record<string, unknown> = { status, chosen_option_id: chosenId, decided_at: new Date().toISOString() }
  if (status === "snoozed") update.snoozed_until = new Date(Date.now() + (Number(body.snoozeHours) || 24) * 3600 * 1000).toISOString()
  const { data, error } = await supabaseServer.from("decisions").update(update).eq("id", id).select("*, route_plans(*)").single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const verb = status === "approved" ? "approved" : status === "rejected" ? "rejected" : "snoozed"
  await logAudit({ userId: existing.user_id, action: `decision_${verb}`, details: { status: "success", summary: `Decision ${verb}: ${existing.title}${chosen ? ` → ${chosen.label}` : ""}`, metadata: { decisionId: id, chosenOptionId: chosenId, traceId: existing.trace_id } } }).catch(() => undefined)

  if (status === "approved" && chosen) {
    await supabaseServer.from("notifications").insert({
      user_id: existing.user_id, title: `✅ ${chosen.kind === "reroute" ? "Reroute" : chosen.kind === "wait" ? "Hold" : "Mitigation"} approved: ${chosen.label}`,
      message: `${existing.title}. ${chosen.detail ?? ""}`.trim(), notification_type: "decision", severity: "LOW", read_status: false,
      citations: { category: "Decision", supplyChainId: existing.supply_chain_id, decisionId: id, chosenOptionId: chosenId, sources: existing.sources ?? [] },
    }).then(() => undefined, () => undefined)
  }
  return NextResponse.json({ decision: data })
}
