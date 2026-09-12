import { NextRequest, NextResponse } from "next/server"
import { agentClient, agentErrorResponse } from "@/lib/agent-client"

export const maxDuration = 90

/** Live per-node risk scores from news (Strands `live_intel` agent). Response contract unchanged. */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const nodes: any[] = body.nodes ?? []
  if (!nodes.length) return NextResponse.json({ error: "nodes are required" }, { status: 400 })
  const compact = nodes.map((n) => ({ id: n.id, label: n.data?.label ?? n.label ?? n.id, country: n.data?.country ?? n.country, type: n.type ?? n.data?.type }))
  try {
    const out = await agentClient.post("/reports/live-intel", { supply_chain_id: body.supplyChainId ?? "canvas", user_id: body.userId ?? "anonymous", nodes: compact })
    return NextResponse.json(out)
  } catch (e) {
    const { status } = agentErrorResponse(e)
    // Neutral baseline so the twin never shows fake disruptions when the service is down.
    return NextResponse.json({
      disruptionsFound: false,
      description: "Agent service unavailable — showing neutral baseline scores.",
      nodeRisks: compact.map((n) => ({ nodeId: n.id, riskScore: 0.2, reason: "Live intelligence unavailable." })),
      degraded: true,
    }, { status: status === 503 ? 200 : status })
  }
}
