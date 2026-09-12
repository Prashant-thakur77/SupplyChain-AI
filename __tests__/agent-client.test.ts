import { describe, expect, it } from "vitest"
import { parseSse } from "@/lib/agent-client"

describe("parseSse", () => {
  it("splits frames across chunks", () => {
    const buf = { rest: "" }
    const a = parseSse('event: node_start\ndata: {"type":"node_start","node":"analyst"}\n\nevent: fin', buf)
    expect(a).toEqual([{ event: "node_start", data: '{"type":"node_start","node":"analyst"}' }])
    const b = parseSse("al\ndata: {}\n\n", buf)
    expect(b).toEqual([{ event: "final", data: "{}" }])
  })
  it("accepts CRLF line endings (sse-starlette)", () => {
    expect(parseSse("event: node_end\r\ndata: {\"a\":1}\r\n\r\n", { rest: "" })).toEqual([{ event: "node_end", data: '{"a":1}' }])
  })
  it("ignores comment/keepalive frames", () => {
    expect(parseSse(": ping\n\n", { rest: "" })).toEqual([])
  })
})
