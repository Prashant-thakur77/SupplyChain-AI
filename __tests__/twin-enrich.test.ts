import { describe, expect, it } from "vitest"
import { enrichEdges, estimateLane, haversineKm } from "@/lib/twin-enrich"

describe("twin-enrich", () => {
  it("haversine Shenzhen→Singapore ≈ 2600 km", () => { expect(Math.abs(haversineKm(22.54, 114.06, 1.29, 103.85) - 2600)).toBeLessThan(80) })
  it("sea is cheaper and slower than air", () => { const s = estimateLane("sea", 2600), a = estimateLane("air", 2600); expect(s.cost).toBeLessThan(a.cost); expect(s.transitDays).toBeGreaterThan(a.transitDays) })
  it("fills only missing values and flags estimates", () => {
    const { edges, notes } = enrichEdges([{ id: "a", lat: 22.54, lng: 114.06 }, { id: "b", lat: 1.29, lng: 103.85 }, { id: "c" }],
      [{ id: "e1", source: "a", target: "b", mode: "sea", cost: 0, transitTime: 5 }, { id: "e2", source: "a", target: "b", mode: "sea", cost: 1000, transitTime: 5 }, { id: "e3", source: "b", target: "c", mode: "road" }])
    expect(edges[0].cost).toBeGreaterThan(0); expect(edges[0].transitTime).toBe(5); expect(edges[0].estimated).toBe(true)
    expect(edges[1].cost).toBe(1000); expect(edges[1].estimated).toBeUndefined()
    expect(edges[2].cost).toBeUndefined(); expect(notes.some((n) => n.includes("no coordinates"))).toBe(true)
  })
})

import { placeQuery } from "@/lib/geocode"
describe("placeQuery", () => {
  it("strips facility words", () => {
    expect(placeQuery("Port of Rotterdam")).toBe("Rotterdam")
    expect(placeQuery("Shenzhen Plant")).toBe("Shenzhen")
    expect(placeQuery("Berlin DC")).toBe("Berlin")
    expect(placeQuery("Tier 2 supplier — Pune")).toBe("Pune")
  })
})
