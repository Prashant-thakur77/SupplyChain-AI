// Client data layer for the Decision Inbox (runs under the user's RLS).
import { supabaseClient } from "@/lib/supabase/client"
import type { DecisionOption, DecisionRow, DecisionStatus, Severity } from "@/types/agent"

const db = supabaseClient as any

export async function listDecisions(userId: string, status?: DecisionStatus | DecisionStatus[]): Promise<DecisionRow[]> {
  let q = db.from("decisions").select("*, route_plans(*)").eq("user_id", userId).order("created_at", { ascending: false }).limit(100)
  if (status) q = Array.isArray(status) ? q.in("status", status) : q.eq("status", status)
  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as DecisionRow[]
}

export async function countPending(userId: string): Promise<number> {
  const { count } = await db.from("decisions").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("status", "pending")
  return count ?? 0
}

export async function decide(id: string, status: Exclude<DecisionStatus, "pending">, chosenOptionId?: string | null, snoozeHours?: number) {
  const res = await fetch(`/api/decisions/${id}`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ status, chosenOptionId: chosenOptionId ?? null, snoozeHours }),
  })
  if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error ?? `Failed (${res.status})`)
  return (await res.json()) as { decision: DecisionRow }
}

export const fmtMoney = (n: number) => `${n < 0 ? "-" : n > 0 ? "+" : ""}$${Math.round(Math.abs(n)).toLocaleString()}`
export const fmtDays = (n: number) => `${n > 0 ? "+" : ""}${Math.round(n)}d`

/** One-line summary used on option rows and toasts, e.g. "+$1,000 · +4d · low risk". */
export function summarizeOption(o: DecisionOption): string {
  const parts: string[] = []
  if (o.kind === "reroute" || o.kind === "mitigate") parts.push(fmtMoney(o.added_cost))
  if (o.added_days) parts.push(fmtDays(o.added_days))
  parts.push(`${o.risk.toLowerCase()} risk`)
  return parts.join(" · ")
}

export const severityRank: Record<Severity, number> = { LOW: 0, MEDIUM: 1, HIGH: 2, CRITICAL: 3 }
