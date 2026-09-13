// A connector pulls records from a system of record and maps them onto canonical rows.
// Every kind (generic REST, CSV URL, SAP, NetSuite, Odoo) reduces to: fetch records → pick fields → resolve sites.
export type ConnectorKind = "rest" | "csv_url" | "sap" | "netsuite" | "odoo"
export type ConnectorEntity = "flows" | "shipments"

export interface ConnectorConfig {
  url: string
  method?: "GET" | "POST"
  headers?: Record<string, string>
  body?: unknown
  /** Dot path to the array of records inside the response (e.g. "d.results", "items"). Empty = response is the array. */
  records_path?: string
  /** Canonical field → source field (dot path allowed). Unmapped canonical fields fall back to a same-named source field. */
  fields?: Record<string, string>
  /** Preset-specific extras (SAP service, NetSuite SuiteQL, Odoo model/domain). */
  preset?: Record<string, unknown>
}

export interface ConnectorRow {
  supply_chain_id: string
  user_id: string | null
  name: string
  kind: ConnectorKind
  entity: ConnectorEntity
  config: ConnectorConfig
}

export const CANONICAL_FIELDS: Record<ConnectorEntity, string[]> = {
  flows: ["origin", "destination", "product", "units_per_week", "value_per_unit", "lead_time_days", "penalty_per_day", "inventory_days"],
  shipments: ["reference", "origin", "destination", "mode", "carrier", "etd", "planned_eta", "value_usd", "status"],
}

export function getPath(obj: unknown, path?: string): unknown {
  if (!path) return obj
  return path.split(".").reduce<any>((o, k) => (o == null ? undefined : o[k]), obj)
}

/** Apply the field mapping to one raw record. */
export function mapRecord(raw: Record<string, unknown>, entity: ConnectorEntity, fields: Record<string, string> = {}): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const f of CANONICAL_FIELDS[entity]) {
    const v = getPath(raw, fields[f] ?? f)
    if (v !== undefined && v !== null && v !== "") out[f] = v
  }
  return out
}
