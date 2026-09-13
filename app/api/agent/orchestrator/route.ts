import { NextRequest, NextResponse } from "next/server"
import { guardSavedTwin } from "@/lib/auth-server"
import { agentClient, agentErrorResponse } from "@/lib/agent-client"
import { agentAudit } from "@/lib/audit-logger"
import { loadTwinForAgent } from "@/lib/server/twin"
import type { AnalysisResult } from "@/types/agent"

export const maxDuration = 240

/** Deep-dive analysis via the Strands analysis Graph (intel → forecast ∥ scenario → strategy → report).
 *  Keeps the legacy response keys used by the orchestrator UI (analysis, coordinationLogs, workflowEfficiency). */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const denied = await guardSavedTwin(body); if (denied) return NextResponse.json({ error: denied.error }, { status: denied.status })
  const { query, supplyChainId, userId } = body
  if (!query) return NextResponse.json({ error: "Query is required for orchestration" }, { status: 400 })
  if (!supplyChainId) return NextResponse.json({ error: "supplyChainId is required" }, { status: 400 })
  const started = Date.now()
  const audit = agentAudit("AnalysisGraph", userId ?? "system")
  try {
    audit.start(`Analysis: ${query}`)
    const twin = await loadTwinForAgent(supplyChainId)
    const result = await agentClient.post<AnalysisResult>("/analysis/sync", { supply_chain_id: supplyChainId, user_id: userId ?? "anonymous", query, twin })
    const coordinationLogs = result.steps.map((s, i) => ({
      stepNumber: i + 1, agent: s.node, action: `Executed ${s.node}`, reasoning: `Strands graph node ${s.node} (${s.status})`,
      input: {}, output: {}, processingTime: s.elapsed_ms ?? 0,
    }))
    audit.success(`Analysis complete (${result.execution_order.join(" → ")})`)
    return NextResponse.json({
      success: true,
      sessionId: result.trace_id,
      analysis: result.report_markdown,
      forecast: result.forecast,
      scenarios: result.scenarios?.scenarios ?? [],
      coordinationLogs,
      executionOrder: result.execution_order,
      workflowEfficiency: { totalTime: Date.now() - started, steps: coordinationLogs.length, engine: "strands-graph" },
    })
  } catch (e) {
    audit.error(String((e as Error).message))
    const { body: eb, status } = agentErrorResponse(e)
    return NextResponse.json({ success: false, ...eb }, { status })
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok", engine: "strands-graph", agentService: agentClient.base })
}
