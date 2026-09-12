// Client-safe incremental SSE parser (no env access). Shared by the server agent client and browser hooks.
export function parseSse(chunk: string, buffer: { rest: string }): Array<{ event: string; data: string }> {
  buffer.rest += chunk.replace(/\r\n/g, "\n")
  const frames: Array<{ event: string; data: string }> = []
  let idx: number
  while ((idx = buffer.rest.indexOf("\n\n")) >= 0) {
    const raw = buffer.rest.slice(0, idx)
    buffer.rest = buffer.rest.slice(idx + 2)
    let event: string | null = null
    const data: string[] = []
    for (const line of raw.split("\n")) {
      if (line.startsWith("event:")) event = line.slice(6).trim()
      else if (line.startsWith("data:")) data.push(line.slice(5).trim())
    }
    if (event !== null || data.length) frames.push({ event: event ?? "message", data: data.join("\n") })
  }
  return frames
}

/** Consume an SSE `Response` in the browser. Resolves with the parsed `final` frame (or null). */
export async function consumeSse<T = any>(res: Response, onEvent: (event: string, data: any) => void, signal?: AbortSignal): Promise<T | null> {
  const reader = res.body!.getReader()
  const dec = new TextDecoder()
  const buf = { rest: "" }
  let result: T | null = null
  for (;;) {
    if (signal?.aborted) { await reader.cancel(); break }
    const { value, done } = await reader.read()
    if (done) break
    for (const f of parseSse(dec.decode(value, { stream: true }), buf)) {
      let data: any = null
      try { data = f.data ? JSON.parse(f.data) : null } catch { data = { raw: f.data } }
      if (f.event === "final") result = data
      else onEvent(f.event, data)
    }
  }
  return result
}
