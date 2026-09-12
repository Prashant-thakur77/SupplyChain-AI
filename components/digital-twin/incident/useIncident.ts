"use client"

import { useCallback, useEffect } from "react"
import type { Edge, Node } from "reactflow"
import { toast } from "sonner"
import { useGraphStream } from "@/components/agent-activity/useGraphStream"
import { useDigitalTwinStore } from "@/lib/digitalTwinStore"
import type { DecisionRow, IncidentEvent, IncidentResult, RouteCandidate } from "@/types/agent"
import { ROUTE_EDGE_PREFIX, routeColor } from "./route-colors"

interface Options {
  /** Proxy endpoint to stream from. Default: /api/agent/incident. The demo uses /api/demo/incident. */
  endpoint?: string
  supplyChainId: string
  userId?: string
  persist?: boolean
}

/** Build the overlay edges for the top-ranked candidates (one polyline per candidate, colour by rank). */
export function routeOverlayEdges(candidates: RouteCandidate[], rankedIds: string[]): Edge[] {
  const out: Edge[] = []
  rankedIds.slice(0, 3).forEach((cid, rank) => {
    const c = candidates.find((x) => x.id === cid)
    if (!c || !c.feasible) return
    for (let i = 0; i < c.path.length - 1; i++) {
      out.push({
        id: `${ROUTE_EDGE_PREFIX}${cid}-${i}`, source: c.path[i], target: c.path[i + 1], type: "route", zIndex: 1000,
        data: { routeId: cid, color: routeColor(rank), rank, showLabel: i === Math.floor((c.path.length - 2) / 2), label: `${rank + 1}: +$${Math.round(c.added_cost).toLocaleString()} · +${Math.round(c.added_days)}d` },
      })
    }
  })
  return out
}

export function useIncident(opts: Options) {
  const stream = useGraphStream()
  const { nodes, edges, setOverlay, setDisruptedNodes, setDisruptedEdges, setIncident, incident, selectedRouteId, setSelectedRouteId, clearDisruptions, setIsAnalyzingDisruption } = useDigitalTwinStore()

  const applyResult = useCallback((result: IncidentResult) => {
    const failed = new Set(result.assessment.failed_node_ids)
    const downstream = new Set(result.assessment.affected_node_ids)
    const ranked = result.ranking?.ranked_candidate_ids ?? []
    const overlay = result.plan ? routeOverlayEdges(result.plan.candidates, ranked) : []
    const onRoute = new Set(overlay.flatMap((e) => [e.source, e.target]))
    const states: Record<string, "failed" | "downstream" | "onRoute"> = {}
    for (const n of useDigitalTwinStore.getState().nodes as Node[]) {
      if (failed.has(n.id)) states[n.id] = "failed"
      else if (onRoute.has(n.id)) states[n.id] = "onRoute"
      else if (downstream.has(n.id)) states[n.id] = "downstream"
    }
    setOverlay(overlay, states)
    // Failed nodes pulse red; downstream nodes that now sit on a reroute are shown as recovered (green ring) rather than disrupted.
    setDisruptedNodes([...failed, ...[...downstream].filter((id) => !onRoute.has(id))])
    setDisruptedEdges(result.assessment.failed_edge_ids)
    setIncident(result)
  }, [setOverlay, setDisruptedNodes, setDisruptedEdges, setIncident])

  const start = useCallback(async (event: IncidentEvent, extra: Record<string, unknown> = {}) => {
    const st = useDigitalTwinStore.getState()
    setDisruptedNodes(event.failed_node_ids)
    setIsAnalyzingDisruption(true)
    setIncident(null)
    const body = { supplyChainId: opts.supplyChainId, userId: opts.userId, event, persist: opts.persist ?? true, nodes: st.nodes.filter((n) => n.type !== "group"), edges: st.edges, ...extra }
    const result = await stream.start<IncidentResult>(opts.endpoint ?? "/api/agent/incident", body)
    setIsAnalyzingDisruption(false)
    if (result?.assessment) {
      applyResult(result)
      if (result.status === "notified") toast.info(`Assessed as ${result.assessment.severity} — logged, no decision needed.`)
      else toast.success(result.decision_id ? "Decision created in your inbox" : "Decision ready")
    } else if (stream.status === "error" || !result) {
      toast.error(stream.error ?? "Incident analysis failed")
    }
    return result
  }, [opts.endpoint, opts.supplyChainId, opts.userId, opts.persist, stream, setDisruptedNodes, setIsAnalyzingDisruption, setIncident, applyResult])

  const clear = useCallback(() => { stream.reset(); clearDisruptions() }, [stream, clearDisruptions])

  // Mirror this hook instance's stream into the store so any IncidentOverlay on the page can render it.
  const setIncidentStream = useDigitalTwinStore((s) => s.setIncidentStream)
  useEffect(() => { if (stream.status !== "idle") setIncidentStream({ events: stream.events, status: stream.status, error: stream.error, replayed: stream.replayed }) }, [stream.events, stream.status, stream.error, stream.replayed, setIncidentStream])

  /** Show a stored decision (from the inbox) on the twin: overlay its route plans and open the card. */
  const showDecision = useCallback((row: DecisionRow) => {
    const candidates: RouteCandidate[] = (row.route_plans ?? []).map((rp) => ({
      id: rp.candidate_id, origin: rp.path?.[0] ?? "", destination: rp.path?.[rp.path.length - 1] ?? "", path: rp.path ?? [], labels: rp.labels ?? [], modes: rp.modes ?? [],
      cost: Number(rp.cost), transit_days: Number(rp.transit_days), max_risk: Number(rp.max_risk), baseline_cost: 0, baseline_days: 0,
      added_cost: Number(rp.added_cost), added_days: Number(rp.added_days), feasible: !!rp.feasible,
    }))
    const rankedIds = row.options.filter((o) => o.kind === "reroute" && o.route_candidate_id).map((o) => o.route_candidate_id!) 
    const onRouteNodes = new Set(candidates.filter((c) => rankedIds.includes(c.id)).flatMap((c) => c.path))
    const allNodes = new Set(useDigitalTwinStore.getState().nodes.map((n) => n.id))
    const failed = [...allNodes].filter((id) => !onRouteNodes.has(id) && row.title.toLowerCase().includes((useDigitalTwinStore.getState().nodes.find((n) => n.id === id)?.data?.label ?? "\u0000").toLowerCase()))
    const result: IncidentResult = {
      assessment: { event_id: row.event_id ?? "", title: row.title, summary: row.summary, severity: "HIGH", confidence: row.confidence, failed_node_ids: failed, failed_edge_ids: [], affected_node_ids: [], affected_edge_ids: [], sources: row.sources ?? [], needs_review: row.confidence < 0.6, category: "OTHER" },
      plan: { severity: "HIGH", feasible_count: candidates.filter((c) => c.feasible).length, infeasible_count: candidates.filter((c) => !c.feasible).length, severed_pairs: [], candidates },
      ranking: { ranked_candidate_ids: rankedIds, recommended_candidate_id: row.recommended_option_id, rationale: row.rationale, tradeoffs: [], wait_is_viable: false, wait_rationale: "" },
      impact: null, mitigation: null, decision: { ...row }, decision_id: row.id, notification_id: null, trace_id: row.trace_id ?? "", status: "decision", execution_order: [],
    }
    applyResult(result)
    setSelectedRouteId(row.chosen_option_id ?? row.recommended_option_id)
  }, [applyResult, setSelectedRouteId])

  return { ...stream, start, clear, showDecision, incident, selectedRouteId, selectRoute: setSelectedRouteId, nodes, edges }
}
