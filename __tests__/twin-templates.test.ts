import { describe, expect, it } from "vitest"
import { TWIN_TEMPLATES, templateToRf } from "@/lib/twin-templates"

describe("twin templates", () => {
  it("every template is connected and references valid nodes", () => {
    for (const t of TWIN_TEMPLATES) {
      const ids = new Set(t.nodes.map((n) => n.id))
      for (const e of t.edges) { expect(ids.has(e.s)).toBe(true); expect(ids.has(e.t)).toBe(true) }
      const touched = new Set(t.edges.flatMap((e) => [e.s, e.t]))
      for (const n of t.nodes) expect(touched.has(n.id)).toBe(true)
      const rf = templateToRf(t)
      expect(rf.nodes.every((n) => typeof n.data.lat === "number")).toBe(true)
    }
  })
})
