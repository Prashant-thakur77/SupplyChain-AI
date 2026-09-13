import { NextResponse } from "next/server"
import { agentClient, agentErrorResponse } from "@/lib/agent-client"
import { demoTwin } from "@/lib/demo-twin"

export async function POST() {
  try { return NextResponse.json(await agentClient.post("/resilience", { supply_chain_id: demoTwin.supply_chain_id, user_id: "demo", twin: demoTwin, narrative: false })) }
  catch (e) { const { body, status } = agentErrorResponse(e); return NextResponse.json(body, { status }) }
}
