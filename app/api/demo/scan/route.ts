import { NextRequest, NextResponse } from "next/server"
import { agentClient, agentErrorResponse } from "@/lib/agent-client"
import { demoTwin } from "@/lib/demo-twin"

export const maxDuration = 180
const hits = new Map<string, number[]>()

/** Public demo: run Sentinel (real news + weather) on the demo twin and return the candidate events it found. */
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local"
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60_000)
  if (recent.length >= 2) return NextResponse.json({ error: "Sentinel scans are limited to 2 per minute in the demo." }, { status: 429 })
  hits.set(ip, [...recent, now])
  try {
    const out = await agentClient.post("/sentinel", { supply_chain_id: demoTwin.supply_chain_id, user_id: "demo", twin: demoTwin })
    return NextResponse.json(out)
  } catch (e) {
    const { body, status } = agentErrorResponse(e)
    return NextResponse.json(body, { status })
  }
}
