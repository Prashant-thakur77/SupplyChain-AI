import { describe, expect, it } from "vitest"
import { rfToTwin, rowsToTwin } from "@/lib/twin-mapping"

describe("rowsToTwin", () => {
  it("maps DB rows and coerces numeric strings", () => {
    const t = rowsToTwin("sc", "Demo", [{ node_id: "n1", name: "Shenzhen", type: "factory", capacity: "10", data: { label: "Shenzhen Plant", country: "CN" } }],
      [{ edge_id: "e1", from_node_id: "n1", to_node_id: "n2", data: { mode: "sea", cost: "1200", transitTime: 5 } }, { edge_id: "e2", from_node_id: "n1", to_node_id: null, data: {} }])
    expect(t.nodes[0]).toMatchObject({ id: "n1", label: "Shenzhen Plant", country: "CN", capacity: 10 })
    expect(t.edges).toHaveLength(1)
    expect(t.edges[0]).toMatchObject({ cost: 1200, transit_days: 5, mode: "sea", risk_multiplier: 1 })
  })
})

describe("rfToTwin", () => {
  it("drops group nodes, route overlays and dangling edges; uses edge type as mode", () => {
    const t = rfToTwin(
      [{ id: "a", type: "factoryNode", data: { label: "A", riskLevel: 3 } }, { id: "g", type: "group", data: {} }, { id: "b", type: "portNode", data: { label: "B" } }],
      [{ id: "e1", source: "a", target: "b", type: "sea", data: { cost: 100, transitTime: 2 } }, { id: "route-r1-0", source: "a", target: "b", type: "route" }, { id: "e2", source: "a", target: "g" }],
      "canvas",
    )
    expect(t.nodes.map((n) => n.id)).toEqual(["a", "b"])
    expect(t.nodes[0].risk_level).toBe(3)
    expect(t.edges).toEqual([{ id: "e1", source: "a", target: "b", mode: "sea", cost: 100, transit_days: 2, risk_multiplier: 1 }])
  })
})
