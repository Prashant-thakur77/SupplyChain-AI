import { NextRequest, NextResponse } from "next/server"
import { agentClient, agentErrorResponse } from "@/lib/agent-client"
import { loadTwinForAgent, rfToTwin } from "@/lib/server/twin"
export const maxDuration = 60
export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}))
  try {
    const twin = b.nodes ? rfToTwin(b.nodes, b.edges ?? [], b.supplyChainId ?? "canvas") : await loadTwinForAgent(b.supplyChainId)
    return NextResponse.json(await agentClient.post("/warroom", { supply_chain_id: twin.supply_chain_id, user_id: b.userId ?? "anonymous", twin, scenarios: b.scenarios ?? [], use_presets: b.usePresets ?? true }))
  } catch (e) { const { body, status } = agentErrorResponse(e); return NextResponse.json(body, { status }) }
}
