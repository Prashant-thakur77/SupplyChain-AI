import { describe, it, expect } from "vitest"
import { buildTwin, sampleNodesCsv, sampleEdgesCsv, type Row } from "@/lib/import/twin-import"

// Minimal CSV → rows helper (mirrors what the parser produces, without needing a File).
function toRows(csv: string): Row[] {
  const [head, ...lines] = csv.trim().split("\n")
  const headers = head.split(",")
  return lines
    .filter((l) => l.trim())
    .map((l) => {
      const cells = l.split(",")
      const o: Row = {}
      headers.forEach((h, i) => (o[h.trim()] = (cells[i] ?? "").trim()))
      return o
    })
}

describe("buildTwin", () => {
  it("builds a valid twin from the sample CSVs", () => {
    const r = buildTwin(toRows(sampleNodesCsv()), toRows(sampleEdgesCsv()))
    expect(r.errors).toHaveLength(0)
    expect(r.stats.nodeCount).toBe(5)
    expect(r.stats.edgeCount).toBe(4)
  })

  it("produces canvas-shaped nodes (type key + data fields)", () => {
    const r = buildTwin(toRows(sampleNodesCsv()), [])
    const supplier = r.nodes.find((n) => (n.data as any).type === "Supplier")!
    expect(supplier.type).toBe("supplierNode")
    expect((supplier.data as any).label).toBeTruthy()
    expect(supplier.position).toHaveProperty("x")
    expect(supplier.position).toHaveProperty("y")
  })

  it("produces transportEdge-shaped edges", () => {
    const r = buildTwin(toRows(sampleNodesCsv()), toRows(sampleEdgesCsv()))
    expect(r.edges[0].type).toBe("transportEdge")
    expect((r.edges[0].data as any).mode).toBeTruthy()
  })

  it("normalizes risk given on a 0–100 scale to 0–1", () => {
    const r = buildTwin(toRows("name,type,riskScore\nAcme,Supplier,80"), [])
    expect((r.nodes[0].data as any).riskScore).toBeCloseTo(0.8)
    expect((r.nodes[0].data as any).riskLevel).toBe("High")
  })

  it("resolves edges by node name as well as id", () => {
    const r = buildTwin(
      toRows("name,type\nAcme Supplier,Supplier\nEast DC,Distribution Center"),
      toRows("source,target\nAcme Supplier,East DC"),
    )
    expect(r.errors).toHaveLength(0)
    expect(r.edges).toHaveLength(1)
    expect(r.edges[0].source).toBe("acme-supplier")
    expect(r.edges[0].target).toBe("east-dc")
  })

  it("rejects an unknown node type with a clear error", () => {
    const r = buildTwin(toRows("name,type\nFoo,Spaceship"), [])
    expect(r.errors.some((e) => e.includes("unknown type"))).toBe(true)
    expect(r.stats.nodeCount).toBe(0)
  })

  it("rejects an edge that references a missing node", () => {
    const r = buildTwin(toRows("name,type\nOnly,Supplier"), toRows("source,target\nOnly,Ghost"))
    expect(r.errors.some((e) => e.toLowerCase().includes("does not match"))).toBe(true)
  })

  it("errors when there are no valid nodes", () => {
    const r = buildTwin([], [])
    expect(r.errors.some((e) => e.includes("No valid nodes"))).toBe(true)
  })

  it("warns (not errors) when nodes have no edges", () => {
    const r = buildTwin(toRows(sampleNodesCsv()), [])
    expect(r.errors).toHaveLength(0)
    expect(r.warnings.some((w) => w.toLowerCase().includes("no edges"))).toBe(true)
  })
})
