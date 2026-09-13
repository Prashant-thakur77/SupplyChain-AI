import { describe, expect, it } from "vitest"
import { mockProvider } from "@/lib/tracking/providers"

describe("mock tracking provider", () => {
  it("derives progress from ETD/ETA and marks arrivals", async () => {
    const day = 86400000, now = Date.now()
    const u = await mockProvider.poll([
      { reference: "A1", etd: new Date(now - 2 * day).toISOString(), planned_eta: new Date(now + 2 * day).toISOString(), status: "in_transit" },
      { reference: "B2", etd: new Date(now - 9 * day).toISOString(), planned_eta: new Date(now - 1 * day).toISOString(), status: "in_transit" },
      { reference: "C3", etd: null, planned_eta: null, status: "planned" },
    ])
    expect(u.map((x) => x.reference)).toEqual(["A1", "B2"])
    expect(u[0].progress).toBeCloseTo(0.5, 1)
    expect(u[1].status).toBe("arrived")
  })
})
