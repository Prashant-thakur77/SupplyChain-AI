import { describe, expect, it } from "vitest"
import { lintTwin } from "@/lib/twin-lint"

describe("lintTwin", () => {
  it("flags orphans, zero-cost lanes, missing coords and duplicates", () => {
    const r = lintTwin(
      [{ id: "a", data: { label: "A", lat: 1, lng: 2, country: "X" } }, { id: "b", data: { label: "B" } }, { id: "c", data: { label: "a", lat: 3, lng: 4 } }] as any,
      [{ id: "e1", source: "a", target: "b", data: { cost: 0, transitTime: 2 } }] as any,
    )
    const codes = r.issues.map((i) => i.code)
    expect(codes).toEqual(expect.arrayContaining(["no-coords", "zero-cost", "orphan", "duplicate-label"]))
    expect(r.score).toBeLessThan(100)
  })
  it("scores a clean twin 100", () => {
    const r = lintTwin([{ id: "a", data: { label: "A", lat: 1, lng: 2, country: "X" } }, { id: "b", data: { label: "B", lat: 3, lng: 4, country: "Y" } }] as any, [{ id: "e1", source: "a", target: "b", data: { cost: 10, transitTime: 2 } }] as any)
    expect(r.score).toBe(100); expect(r.issues).toHaveLength(0)
  })
})
