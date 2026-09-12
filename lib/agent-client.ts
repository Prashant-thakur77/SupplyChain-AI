// Server-side client for the Strands agent-service. Used only from Next.js route handlers.

const BASE = (process.env.AGENT_SERVICE_URL ?? "http://localhost:8080").replace(/\/$/, "")
const SECRET = process.env.AGENT_SERVICE_SECRET ?? ""

export class AgentServiceError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = "AgentServiceError"
  }
}

import { parseSse } from "@/lib/sse"
export { parseSse }

async function doFetch(path: string, body: unknown, accept = "application/json"): Promise<Response> {
  let res: Response
  try {
    res = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json", accept, "x-agent-secret": SECRET },
      body: JSON.stringify(body),
    })
  } catch (e) {
    throw new AgentServiceError(503, `agent-service unreachable at ${BASE}: ${(e as Error).message}`)
  }
  if (!res.ok) throw new AgentServiceError(res.status, `agent-service ${path} → ${res.status}: ${await res.text().catch(() => "")}`)
  return res
}

export const agentClient = {
  base: BASE,
  async post<T = any>(path: string, body: unknown): Promise<T> {
    return (await doFetch(path, body)).json()
  },
  /** Consume an SSE stream server-side; resolves with the parsed `final` frame. */
  async stream<T = any>(path: string, body: unknown, onEvent: (event: string, data: any) => void): Promise<T | null> {
    const res = await doFetch(path, body, "text/event-stream")
    const reader = res.body!.getReader()
    const dec = new TextDecoder()
    const buf = { rest: "" }
    let result: T | null = null
    for (;;) {
      const { value, done } = await reader.read()
      if (done) break
      for (const f of parseSse(dec.decode(value, { stream: true }), buf)) {
        const data = f.data ? JSON.parse(f.data) : null
        if (f.event === "final") result = data
        else onEvent(f.event, data)
      }
    }
    return result
  },
  /** Pass the agent-service SSE body straight through to the browser. */
  async proxyStream(path: string, body: unknown): Promise<Response> {
    const res = await doFetch(path, body, "text/event-stream")
    return new Response(res.body, {
      headers: { "content-type": "text/event-stream", "cache-control": "no-cache, no-transform", connection: "keep-alive", "x-accel-buffering": "no" },
    })
  },
}

/** Uniform error → NextResponse-ready payload. */
export function agentErrorResponse(e: unknown): { body: { error: string; detail: string }; status: number } {
  const status = e instanceof AgentServiceError ? (e.status === 503 ? 503 : 502) : 500
  return { body: { error: status === 503 ? "Agent service unavailable" : "Agent service error", detail: String((e as Error)?.message ?? e) }, status }
}
