import type { ConnectorConfig, ConnectorEntity, ConnectorKind } from "./types"

/** Presets turn a vendor-specific API into the generic REST shape. Fill the url/auth and the connector runs. */
export function presetConfig(kind: ConnectorKind, entity: ConnectorEntity, cfg: Partial<ConnectorConfig>): ConnectorConfig {
  const base: ConnectorConfig = { url: cfg.url ?? "", method: cfg.method ?? "GET", headers: cfg.headers ?? {}, body: cfg.body, records_path: cfg.records_path, fields: cfg.fields ?? {}, preset: cfg.preset ?? {} }
  switch (kind) {
    case "sap": // S/4HANA OData v2: /sap/opu/odata/sap/API_PURCHASEORDER_PROCESS_SRV/A_PurchaseOrder?$format=json
      return { ...base, headers: { Accept: "application/json", ...base.headers }, records_path: base.records_path ?? "d.results",
        fields: entity === "shipments" ? { reference: "PurchaseOrder", origin: "Supplier", destination: "Plant", etd: "PurchaseOrderDate", planned_eta: "ScheduleLineDeliveryDate", value_usd: "NetAmount", ...base.fields } : { origin: "Supplier", destination: "Plant", product: "Material", units_per_week: "OrderQuantity", value_per_unit: "NetPriceAmount", ...base.fields } }
    case "netsuite": // SuiteQL: POST /services/rest/query/v1/suiteql { q: "SELECT ..." }
      return { ...base, method: "POST", headers: { "Content-Type": "application/json", Prefer: "transient", ...base.headers }, records_path: base.records_path ?? "items",
        body: base.body ?? { q: (base.preset?.suiteql as string) ?? "SELECT tranid AS reference, entity AS origin, location AS destination, trandate AS etd, shipdate AS planned_eta, total AS value_usd FROM transaction WHERE type = 'PurchOrd'" } }
    case "odoo": // JSON-RPC search_read on stock.picking
      return { ...base, method: "POST", headers: { "Content-Type": "application/json", ...base.headers }, records_path: base.records_path ?? "result",
        body: base.body ?? { jsonrpc: "2.0", method: "call", params: { service: "object", method: "execute_kw", args: [base.preset?.db, base.preset?.uid, base.preset?.password, "stock.picking", "search_read", [[["state", "in", ["assigned", "done"]]]], { fields: ["name", "partner_id", "location_dest_id", "scheduled_date", "date_deadline", "origin"] }] } },
        fields: { reference: "name", origin: "partner_id.1", destination: "location_dest_id.1", etd: "scheduled_date", planned_eta: "date_deadline", ...base.fields } }
    default:
      return base
  }
}
