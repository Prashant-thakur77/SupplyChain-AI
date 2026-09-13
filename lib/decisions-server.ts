// The single place where a decision changes state (used by the JSON API and by signed action links).
import { agentClient } from "@/lib/agent-client"
import { logAudit } from "@/lib/audit-logger"
import { supabaseServer } from "@/lib/supabase/server"

export async function applyDecision(id: string, status: "approved" | "rejected" | "snoozed" | "expired", actorUserId: string, chosenOptionId?: string | null, snoozeHours = 24) {
  const { data: existing, error: readErr } = await supabaseServer.from("decisions").select("*").eq("id", id).single()
  if (readErr || !existing) return { error: "decision not found", status: 404 as const }
  if (existing.status !== "pending" && existing.status !== "snoozed" && status !== "expired") return { error: `decision is already ${existing.status}`, status: 409 as const, decision: existing }
  const options: any[] = existing.options ?? []
  const chosenId: string | null = status === "approved" ? chosenOptionId ?? existing.recommended_option_id : chosenOptionId ?? null
  if (status === "approved" && !options.some((o) => o.id === chosenId)) return { error: "chosenOptionId not in options", status: 400 as const }
  const chosen = options.find((o) => o.id === chosenId)
  const update: Record<string, unknown> = { status, chosen_option_id: chosenId, decided_at: new Date().toISOString() }
  if (status === "snoozed") update.snoozed_until = new Date(Date.now() + snoozeHours * 3600 * 1000).toISOString()
  const { data, error } = await supabaseServer.from("decisions").update(update).eq("id", id).select("*, route_plans(*)").single()
  if (error) return { error: error.message, status: 500 as const }
  const verb = status === "approved" ? "approved" : status === "rejected" ? "rejected" : status
  await logAudit({ userId: actorUserId, action: `decision_${verb}`, details: { status: "success", summary: `Decision ${verb}: ${existing.title}${chosen ? ` → ${chosen.label}` : ""}`, metadata: { decisionId: id, chosenOptionId: chosenId, traceId: existing.trace_id } } }).catch(() => undefined)
  if (status === "approved" && chosen) {
    await supabaseServer.from("notifications").insert({
      user_id: existing.user_id, title: `✅ ${chosen.kind === "reroute" ? "Reroute" : chosen.kind === "wait" ? "Hold" : "Mitigation"} approved: ${chosen.label}`,
      message: `${existing.title}. ${chosen.detail ?? ""}`.trim(), notification_type: "decision", severity: "LOW", read_status: false,
      citations: { category: "Decision", supplyChainId: existing.supply_chain_id, decisionId: id, chosenOptionId: chosenId, sources: existing.sources ?? [] },
    }).then(() => undefined, () => undefined)
  }
  if (status === "approved" || status === "rejected") {
    agentClient.post("/memory", { supply_chain_id: existing.supply_chain_id, user_id: existing.user_id ?? "system", title: existing.title, status, option_label: chosen?.label ?? null, added_cost: chosen?.added_cost ?? null, added_days: chosen?.added_days ?? null })
      .catch((e) => console.warn("[decisions] memory store failed:", (e as Error).message))
  }
  return { decision: data, status: 200 as const }
}
