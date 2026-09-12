"use client"

import { useCallback, useRef, useState } from "react"
import { consumeSse } from "@/lib/sse"
import type { GraphEvent } from "@/types/agent"

export type StreamStatus = "idle" | "running" | "done" | "error"
export interface ActivityEvent extends GraphEvent { at: number }

/** Browser-side consumer of a streaming agent endpoint (SSE via the Next.js proxy). */
export function useGraphStream() {
  const [events, setEvents] = useState<ActivityEvent[]>([])
  const [status, setStatus] = useState<StreamStatus>("idle")
  const [error, setError] = useState<string | null>(null)
  const [replayed, setReplayed] = useState<string | null>(null)
  const abort = useRef<AbortController | null>(null)

  const start = useCallback(async <T = any>(path: string, body: unknown): Promise<T | null> => {
    abort.current?.abort()
    const ctrl = new AbortController()
    abort.current = ctrl
    setEvents([])
    setError(null)
    setReplayed(null)
    setStatus("running")
    try {
      const res = await fetch(path, { method: "POST", headers: { "content-type": "application/json", accept: "text/event-stream" }, body: JSON.stringify(body), signal: ctrl.signal })
      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.detail ?? j.error ?? `Request failed (${res.status})`)
      }
      const result = await consumeSse<T>(res, (event, data) => {
        if (event === "replay") { setReplayed(data?.recorded_at ?? "earlier"); return }
        if (event === "error") setError(data?.payload?.error ?? data?.error ?? "Agent error")
        setEvents((prev) => [...prev, { ...(data ?? {}), type: (data?.type ?? event) as GraphEvent["type"], at: Date.now() }])
      }, ctrl.signal)
      setStatus("done")
      return result
    } catch (e) {
      if ((e as Error).name === "AbortError") { setStatus("idle"); return null }
      setError((e as Error).message)
      setStatus("error")
      return null
    }
  }, [])

  const reset = useCallback(() => { abort.current?.abort(); setEvents([]); setStatus("idle"); setError(null); setReplayed(null) }, [])
  return { events, status, error, replayed, start, reset }
}
