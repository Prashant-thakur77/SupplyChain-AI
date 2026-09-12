import { NextRequest, NextResponse } from "next/server"
import { agentClient, agentErrorResponse } from "@/lib/agent-client"
import { demoTwin } from "@/lib/demo-twin"

export const maxDuration = 90

/** Public demo copilot: fixed demo twin, no persistence. */
export async function POST(req: NextRequest) {
  const { message, history } = await req.json().catch(() => ({}))
  if (!message || String(message).length > 600) return NextResponse.json({ error: "message is required (max 600 chars)" }, { status: 400 })
  try {
    return await agentClient.proxyStream("/chat", { supply_chain_id: demoTwin.supply_chain_id, user_id: "demo", message, history: Array.isArray(history) ? history.slice(-20) : [], twin: demoTwin })
  } catch (e) {
    const { body, status } = agentErrorResponse(e)
    return NextResponse.json(body, { status })
  }
}
