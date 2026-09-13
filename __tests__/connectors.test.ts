import { describe, expect, it } from "vitest"
import { fetchRecords } from "@/lib/connectors/fetch"
import { presetConfig } from "@/lib/connectors/presets"
import { makeResolver } from "@/lib/connectors/sync"
import { mapRecord } from "@/lib/connectors/types"

const fakeFetch = (body: unknown, ok = true, csv = false) => (async () => ({ ok, status: ok ? 200 : 500, json: async () => body, text: async () => String(body) })) as unknown as typeof fetch

describe("connectors", () => {
  it("SAP preset walks d.results and maps PO fields", async () => {
    const cfg = presetConfig("sap", "shipments", { url: "https://sap.example/odata" })
    const recs = await fetchRecords("sap", cfg, fakeFetch({ d: { results: [{ PurchaseOrder: "4500001", Supplier: "Shenzhen Plant", Plant: "Berlin DC", NetAmount: "1200.5" }] } }))
    const m = mapRecord(recs[0], "shipments", cfg.fields)
    expect(m).toMatchObject({ reference: "4500001", origin: "Shenzhen Plant", destination: "Berlin DC", value_usd: "1200.5" })
  })
  it("csv_url parses rows with headers", async () => {
    const recs = await fetchRecords("csv_url", { url: "https://x/y.csv" }, fakeFetch("reference,origin,destination\nA1,S1,D1\n", true, true))
    expect(recs).toEqual([{ reference: "A1", origin: "S1", destination: "D1" }])
  })
  it("rejects a records_path that is not an array", async () => {
    await expect(fetchRecords("rest", { url: "https://x", records_path: "nope" }, fakeFetch({ items: [] }))).rejects.toThrow(/records_path/)
  })
  it("resolves sites by id or label, case-insensitively", () => {
    const r = makeResolver([{ node_id: "n1", data: { label: "Port of Singapore" } }])
    expect(r("port of singapore")).toBe("n1"); expect(r("N1")).toBe("n1"); expect(r("Mars")).toBeNull()
  })
})
