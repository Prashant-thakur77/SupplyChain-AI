import { NextRequest, NextResponse } from "next/server"
import { logAudit } from "@/lib/audit-logger"
import { supabaseServer } from "@/lib/supabase/server"
import { requireDecisionAccess } from "@/lib/auth-server"

/** GET → tasks for a decision. PATCH { taskId, status } → update one task. */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const g = await requireDecisionAccess(id); if ("error" in g) return NextResponse.json({ error: g.error }, { status: g.status })
  const { data, error } = await supabaseServer.from("decision_tasks").select("*").eq("decision_id", id).order("position")
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ tasks: data ?? [] })
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const g = await requireDecisionAccess(id, true); if ("error" in g) return NextResponse.json({ error: g.error }, { status: g.status })
  const { taskId, status } = await req.json().catch(() => ({}))
  if (!taskId || !["todo", "doing", "done", "skipped"].includes(status)) return NextResponse.json({ error: "taskId and a valid status are required" }, { status: 400 })
  const { data, error } = await supabaseServer.from("decision_tasks").update({ status, done_at: status === "done" ? new Date().toISOString() : null }).eq("id", taskId).eq("decision_id", id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await logAudit({ userId: data.user_id, action: `task_${status}`, details: { status: "success", summary: `Task ${status}: ${data.title}`, metadata: { decisionId: id, taskId } } }).catch(() => undefined)
  return NextResponse.json({ task: data })
}
