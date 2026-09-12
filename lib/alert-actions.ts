// Client data layer for actionable alerts. Reads/writes the append-only
// `alert_actions` table (see supabase_alert_actions.sql) under the user's RLS.

import { supabaseClient } from "@/lib/supabase/client"

export type AlertStatus = "open" | "acknowledged" | "in_progress" | "resolved" | "reopened"

export interface AlertActionState {
  status: AlertStatus
  assignee: string | null
  note: string | null
  updatedAt: string | null
}

export const DEFAULT_ALERT_STATE: AlertActionState = {
  status: "open",
  assignee: null,
  note: null,
  updatedAt: null,
}

// The table isn't in the generated Database types yet, so we read/write untyped.
const db = supabaseClient as any

export async function getLatestAlertAction(notificationId: string): Promise<AlertActionState> {
  try {
    const { data, error } = await db
      .from("alert_actions")
      .select("status, assignee, note, created_at")
      .eq("notification_id", notificationId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
    if (error || !data) return DEFAULT_ALERT_STATE
    return {
      status: (data.status as AlertStatus) ?? "open",
      assignee: data.assignee ?? null,
      note: data.note ?? null,
      updatedAt: data.created_at ?? null,
    }
  } catch {
    return DEFAULT_ALERT_STATE
  }
}

export async function recordAlertAction(input: {
  notificationId: string
  userId: string
  status: Exclude<AlertStatus, "open">
  assignee?: string | null
  note?: string | null
}): Promise<{ ok: boolean; error?: string }> {
  const { error } = await db.from("alert_actions").insert({
    notification_id: input.notificationId,
    user_id: input.userId,
    status: input.status,
    assignee: input.assignee ?? null,
    note: input.note ?? null,
  })
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

const STATUS_LABELS: Record<AlertStatus, string> = {
  open: "Open",
  acknowledged: "Acknowledged",
  in_progress: "In Progress",
  resolved: "Resolved",
  reopened: "Reopened",
}

export function alertStatusLabel(s: AlertStatus): string {
  return STATUS_LABELS[s] ?? "Open"
}
