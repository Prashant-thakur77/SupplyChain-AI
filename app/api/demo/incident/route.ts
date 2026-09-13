import { NextRequest, NextResponse } from "next/server"
import { agentClient, agentErrorResponse } from "@/lib/agent-client"
import { demoTwin } from "@/lib/demo-twin"
import { loadRecording, recordStream, replayStream } from "@/lib/demo-replay"

export const maxDuration = 180

// Public, no-login demo: the twin is passed inline and nothing is persisted. Light per-IP rate limit.
const hits = new Map<string, number[]>()
const LIMIT = 6, WINDOW = 60_000

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local"
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW)
  if (recent.length >= LIMIT) return NextResponse.json({ error: "Too many demo runs — try again in a minute." }, { status: 429 })
  hits.set(ip, [...recent, now])

  const body = await req.json().catch(() => ({}))
  if (!body.event?.failed_node_ids?.length) return NextResponse.json({ error: "event is required" }, { status: 400 })
  const key = String(body.event.id ?? body.event.failed_node_ids.join("-"))
  const isPreset = key.startsWith("demo-")

  // Probe the model quickly; if it is rate-limited and we have a recording of this preset, replay it.
  const recording = isPreset ? await loadRecording(key) : null
  if (body.forceReplay) {
    if (recording) return replayStream(recording)
    return NextResponse.json({ error: "No recording available for this scenario yet." }, { status: 404 })
  }
  // Hosted demo on a free-tier model: presets replay instantly (labelled as a replay); custom disruptions always run live.
  if (recording && process.env.DEMO_PREFER_REPLAY === "true" && !body.live) return replayStream(recording)
  try {
    const upstream = await agentClient.proxyStream("/incident", { supply_chain_id: demoTwin.supply_chain_id, user_id: "demo", event: body.event, twin: demoTwin, persist: false })
    return isPreset ? recordStream(upstream, key) : upstream
  } catch (e) {
    if (recording) return replayStream(recording)
    const { body: eb, status } = agentErrorResponse(e)
    return NextResponse.json(eb, { status })
  }
}
