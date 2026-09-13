import { NextRequest, NextResponse } from "next/server"
import { guardSavedTwin } from "@/lib/auth-server"
import { agentClient, agentErrorResponse } from "@/lib/agent-client"
import { loadTwinForAgent } from "@/lib/server/twin"
export const maxDuration = 30
/** Deterministic demand-shock simulation on the saved twin (needs flows). Body: { supplyChainId, userId, multiplier, durationWeeks, destinationIds } */
export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}))
  const denied = await guardSavedTwin(b); if (denied) return NextResponse.json({ error: denied.error }, { status: denied.status })
  if (!b.supplyChainId) return NextResponse.json({ error: "supplyChainId is required" }, { status: 400 })
  try {
    const twin = await loadTwinForAgent(b.supplyChainId)
    return NextResponse.json(await agentClient.post("/demand-shock", { supply_chain_id: twin.supply_chain_id, user_id: b.userId ?? "anonymous", multiplier: Number(b.multiplier ?? 1.5), duration_weeks: Number(b.durationWeeks ?? 4), destination_ids: b.destinationIds ?? [] }))
  } catch (e) { const { body, status } = agentErrorResponse(e); return NextResponse.json(body, { status }) }
}
