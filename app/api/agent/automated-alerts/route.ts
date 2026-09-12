import { NextRequest, NextResponse } from "next/server"
import { agentClient, agentErrorResponse } from "@/lib/agent-client"
import { agentAudit } from "@/lib/audit-logger"
import { supabaseServer } from "@/lib/supabase/server"

export const maxDuration = 240
const COOLDOWN_MS = 5 * 60 * 1000

/** Sentinel scan for one supply chain: news + weather → analyst → (severity ≥ HIGH) → routing → decision.
 *  Response keeps the legacy keys: { success, alertsGenerated, data, message }. */
export async function GET(request: NextRequest) {
  const sp = new URL(request.url).searchParams
  const supplyChainId = sp.get("supplyChainId")
  const userId = sp.get("userId")
  const force = sp.get("force") === "true"
  if (!supplyChainId || !userId) return NextResponse.json({ error: "Missing supplyChainId or userId" }, { status: 400 })

  // Cooldown: skip if this chain was scanned in the last 5 minutes (agent_traces is the source of truth).
  if (!force) {
    const { data: last } = await supabaseServer.from("agent_traces").select("started_at").eq("supply_chain_id", supplyChainId)
      .eq("workflow_stage", "scan").order("started_at", { ascending: false }).limit(1)
    if (last?.[0] && Date.now() - new Date(last[0].started_at).getTime() < COOLDOWN_MS) {
      return NextResponse.json({ success: true, alertsGenerated: 0, message: "Cooldown active." })
    }
  }
  const audit = agentAudit("Sentinel", userId)
  try {
    const out = await agentClient.post("/scan", { supply_chain_id: supplyChainId, user_id: userId })
    await audit.success(`Scan complete: ${out.scanned} events found, ${out.processed.length} new`, { trace: out.trace_id })
    return NextResponse.json({
      success: true, alertsGenerated: out.processed.length, data: out.processed, scanned: out.scanned, traceId: out.trace_id,
      message: out.processed.length ? undefined : "News evaluated; no new threats for this supply chain.",
    })
  } catch (e) {
    await audit.error(String((e as Error).message))
    const { body, status } = agentErrorResponse(e)
    return NextResponse.json({ success: false, alertsGenerated: 0, ...body }, { status })
  }
}
