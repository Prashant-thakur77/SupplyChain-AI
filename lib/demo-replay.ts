// Demo replay cache. Successful demo incident runs are recorded to disk; if the model is rate-limited later
// (free-tier quotas!), the same SSE frames are replayed with realistic pacing and labelled as a replay.
import { promises as fs } from "fs"
import path from "path"

export interface Recording { key: string; frames: Array<{ event: string; data: string; delay_ms: number }>; final: string; recorded_at: string }

const DIR = path.join(process.cwd(), "lib", "demo-replays")
const safe = (k: string) => k.replace(/[^a-z0-9_-]/gi, "_").slice(0, 80)

export async function loadRecording(key: string): Promise<Recording | null> {
  try { return JSON.parse(await fs.readFile(path.join(DIR, `${safe(key)}.json`), "utf8")) } catch { return null }
}

export async function saveRecording(rec: Recording): Promise<void> {
  try { await fs.mkdir(DIR, { recursive: true }); await fs.writeFile(path.join(DIR, `${safe(rec.key)}.json`), JSON.stringify(rec)) } catch (e) { console.warn("[demo-replay] save failed:", (e as Error).message) }
}

/** Tee an upstream SSE response: stream it to the client while capturing frames; on success persist the recording. */
export function recordStream(upstream: Response, key: string): Response {
  const dec = new TextDecoder()
  const enc = new TextEncoder()
  const frames: Recording["frames"] = []
  let buf = "", finalData: string | null = null, sawError = false, last = Date.now()
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = upstream.body!.getReader()
      for (;;) {
        const { value, done } = await reader.read()
        if (done) break
        controller.enqueue(value)
        buf += dec.decode(value, { stream: true }).replace(/\r\n/g, "\n")
        let i: number
        while ((i = buf.indexOf("\n\n")) >= 0) {
          const raw = buf.slice(0, i); buf = buf.slice(i + 2)
          let event: string | null = null; const data: string[] = []
          for (const line of raw.split("\n")) { if (line.startsWith("event:")) event = line.slice(6).trim(); else if (line.startsWith("data:")) data.push(line.slice(5).trim()) }
          if (event === null && !data.length) continue
          const now = Date.now(); const delay = Math.min(now - last, 15000); last = now
          if (event === "final") finalData = data.join("\n")
          else { if (event === "error") sawError = true; frames.push({ event: event ?? "message", data: data.join("\n"), delay_ms: delay }) }
        }
      }
      controller.close()
      if (finalData && finalData !== "null" && !sawError) await saveRecording({ key, frames, final: finalData, recorded_at: new Date().toISOString() })
    },
  })
  return new Response(stream, { headers: { "content-type": "text/event-stream", "cache-control": "no-cache, no-transform", connection: "keep-alive" } })
}

/** Replay a recording as SSE with (compressed) original pacing. Adds `replayed: true` to the final payload. */
export function replayStream(rec: Recording, speed = 0.5): Response {
  const enc = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      controller.enqueue(enc.encode(`event: replay\ndata: ${JSON.stringify({ recorded_at: rec.recorded_at })}\n\n`))
      for (const f of rec.frames) {
        await new Promise((r) => setTimeout(r, Math.min(f.delay_ms * speed, 6000)))
        controller.enqueue(enc.encode(`event: ${f.event}\ndata: ${f.data}\n\n`))
      }
      let fin: any = null
      try { fin = JSON.parse(rec.final) } catch { fin = null }
      if (fin && typeof fin === "object") fin.replayed = true
      controller.enqueue(enc.encode(`event: final\ndata: ${JSON.stringify(fin)}\n\n`))
      controller.close()
    },
  })
  return new Response(stream, { headers: { "content-type": "text/event-stream", "cache-control": "no-cache, no-transform", connection: "keep-alive" } })
}
