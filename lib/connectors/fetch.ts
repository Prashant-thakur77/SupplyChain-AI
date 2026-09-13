import Papa from "papaparse"
import { getPath, type ConnectorConfig, type ConnectorKind } from "./types"

/** Pull raw records. REST/preset kinds parse JSON and walk records_path; csv_url parses the body as CSV. */
export async function fetchRecords(kind: ConnectorKind, cfg: ConnectorConfig, fetchImpl: typeof fetch = fetch): Promise<Record<string, unknown>[]> {
  if (!cfg.url) throw new Error("connector url is empty")
  const res = await fetchImpl(cfg.url, { method: cfg.method ?? "GET", headers: cfg.headers, body: cfg.method === "POST" ? JSON.stringify(cfg.body ?? {}) : undefined, signal: AbortSignal.timeout(20000) })
  if (!res.ok) throw new Error(`${kind} responded ${res.status}`)
  if (kind === "csv_url") {
    const parsed = Papa.parse<Record<string, string>>(await res.text(), { header: true, skipEmptyLines: true, transformHeader: (h) => h.trim() })
    return parsed.data
  }
  const json = await res.json()
  const recs = getPath(json, cfg.records_path)
  if (!Array.isArray(recs)) throw new Error(`records_path "${cfg.records_path ?? ""}" did not resolve to an array`)
  return recs
}
