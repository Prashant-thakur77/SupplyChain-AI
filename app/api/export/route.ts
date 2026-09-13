import { NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

const csv = (rows: Record<string, any>[], cols: string[]) => [cols.join(","), ...rows.map((r) => cols.map((c) => { const v = r[c]; const s = v == null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s }).join(","))].join("\n")

/** CSV export: ?userId&what=decisions|audit|traces|alerts */
export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams
  const userId = sp.get("userId"), what = sp.get("what") ?? "decisions"
  if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 })
  let rows: any[] = [], cols: string[] = []
  if (what === "decisions") {
    const { data } = await supabaseServer.from("decisions").select("id, created_at, supply_chain_id, title, status, auto_approved, policy_reason, recommended_option_id, chosen_option_id, confidence, rationale, decided_at, trace_id").eq("user_id", userId).order("created_at", { ascending: false }).limit(5000)
    rows = data ?? []; cols = ["id", "created_at", "supply_chain_id", "title", "status", "auto_approved", "policy_reason", "recommended_option_id", "chosen_option_id", "confidence", "rationale", "decided_at", "trace_id"]
  } else if (what === "audit") {
    const { data } = await supabaseServer.from("audit_logs").select("log_id, timestamp, actor, action, status, details").eq("user_id", userId).order("timestamp", { ascending: false }).limit(5000)
    rows = data ?? []; cols = ["log_id", "timestamp", "actor", "action", "status", "details"]
  } else if (what === "traces") {
    const { data } = await supabaseServer.from("agent_traces").select("session_id, agent_name, workflow_stage, started_at, duration_ms, success, input_tokens, output_tokens, supply_chain_id").eq("user_id", userId).order("started_at", { ascending: false }).limit(5000)
    rows = data ?? []; cols = ["session_id", "agent_name", "workflow_stage", "started_at", "duration_ms", "success", "input_tokens", "output_tokens", "supply_chain_id"]
  } else if (what === "alerts") {
    const { data } = await supabaseServer.from("notifications").select("notification_id, created_at, notification_type, severity, title, message, read_status, citations").eq("user_id", userId).order("created_at", { ascending: false }).limit(5000)
    rows = data ?? []; cols = ["notification_id", "created_at", "notification_type", "severity", "title", "message", "read_status", "citations"]
  } else return NextResponse.json({ error: "unknown export" }, { status: 400 })
  return new NextResponse(csv(rows, cols), { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="${what}-${new Date().toISOString().slice(0, 10)}.csv"` } })
}
