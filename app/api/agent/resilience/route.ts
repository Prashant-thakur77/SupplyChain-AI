import { NextRequest, NextResponse } from "next/server"
import { guardSavedTwin } from "@/lib/auth-server"
import { agentClient, agentErrorResponse } from "@/lib/agent-client"
import { loadTwinForAgent, rfToTwin } from "@/lib/server/twin"

export const maxDuration = 120

/** Resilience audit for a saved twin or canvas state. Body: { supplyChainId, userId?, nodes?, edges?, narrative? } */
export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}))
  const denied = await guardSavedTwin(b); if (denied) return NextResponse.json({ error: denied.error }, { status: denied.status })
  try {
    const twin = b.nodes ? rfToTwin(b.nodes, b.edges ?? [], b.supplyChainId ?? "canvas") : await loadTwinForAgent(b.supplyChainId)
    return NextResponse.json(await agentClient.post("/resilience", { supply_chain_id: twin.supply_chain_id, user_id: b.userId ?? "anonymous", twin, narrative: !!b.narrative }))
  } catch (e) { const { body, status } = agentErrorResponse(e); return NextResponse.json(body, { status }) }
}
