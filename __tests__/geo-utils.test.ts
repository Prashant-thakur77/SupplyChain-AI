import { describe, expect, it } from "vitest"
import { greatCircle, nodeKind } from "@/components/geo/geo-utils"

describe("greatCircle", () => {
  it("starts and ends at the endpoints and bows toward the pole", () => {
    const pts = greatCircle([51.9, 4.5], [40.7, -74.0], 16)
    expect(pts[0]).toEqual([51.9, 4.5]); expect(pts[pts.length - 1][0]).toBeCloseTo(40.7, 5)
    expect(Math.max(...pts.map((p) => p[0]))).toBeGreaterThan(52)
  })
  it("unwraps antimeridian crossings", () => {
    const pts = greatCircle([35.7, 139.7], [34.0, -118.2], 16)
    for (let i = 1; i < pts.length; i++) expect(Math.abs(pts[i][1] - pts[i - 1][1])).toBeLessThan(180)
  })
})
describe("nodeKind", () => { it("maps RF types", () => { expect(nodeKind({ type: "portNode" })).toBe("port"); expect(nodeKind({ data: { type: "Factory" } })).toBe("factory"); expect(nodeKind({ type: "x" })).toBe("warehouse") }) })
