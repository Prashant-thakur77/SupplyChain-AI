import { NextRequest, NextResponse } from "next/server"
import { agentClient, agentErrorResponse } from "@/lib/agent-client"
import { demoTwin } from "@/lib/demo-twin"
export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}))
  try { return NextResponse.json(await agentClient.post("/warroom", { supply_chain_id: demoTwin.supply_chain_id, user_id: "demo", twin: demoTwin, scenarios: b.scenarios ?? [], use_presets: true })) }
  catch (e) { const { body, status } = agentErrorResponse(e); return NextResponse.json(body, { status }) }
}
