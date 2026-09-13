// TypeScript mirror of agent-service/schemas.py. Keep field names identical.
export type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"

export interface Source { title: string; url: string; published_at?: string | null; credibility: number }

export interface TwinNode { id: string; label: string; type: string; lat?: number | null; lng?: number | null; country?: string | null; capacity: number; risk_level: number; data?: Record<string, any> }
export interface TwinEdge { id: string; source: string; target: string; mode: string; cost: number; transit_days: number; risk_multiplier: number; capacity?: number | null }
export interface Twin { supply_chain_id: string; name: string; nodes: TwinNode[]; edges: TwinEdge[] }

export interface IncidentEvent {
  id: string
  kind: "news" | "weather" | "manual" | "simulation"
  title: string
  description: string
  location?: string | null
  lat?: number | null
  lng?: number | null
  occurred_at?: string | null
  sources?: Source[]
  failed_node_ids: string[]
  failed_edge_ids: string[]
}

export interface Assessment {
  event_id: string; title: string; summary: string; severity: Severity; confidence: number
  failed_node_ids: string[]; failed_edge_ids: string[]; affected_node_ids: string[]; affected_edge_ids: string[]
  sources: Source[]; needs_review: boolean; category: string
}

export interface RouteCandidate {
  id: string; origin: string; destination: string; path: string[]; labels: string[]; modes: string[]
  cost: number; transit_days: number; max_risk: number; baseline_cost: number; baseline_days: number
  added_cost: number; added_days: number; feasible: boolean
  co2_kg?: number; baseline_co2_kg?: number; added_co2_kg?: number
}

export interface ReroutePlan { severity: Severity; feasible_count: number; infeasible_count: number; severed_pairs: [string, string][]; baseline?: Record<string, number>; carbon_weight?: number; candidates: RouteCandidate[] }

export interface RouteRanking { ranked_candidate_ids: string[]; recommended_candidate_id: string | null; rationale: string; tradeoffs: string[]; wait_is_viable: boolean; wait_rationale: string }
export interface ImpactEstimate { revenue_at_risk_usd: number; delay_days: number; nodes_affected: number; orders_affected_pct: number; summary: string; assumptions: string[]; contract_penalties_usd?: number; contract_lines?: { counterparty: string; kind: string; site: string; penalty_usd: number; capped?: boolean }[] }
export interface MitigationStep { title: string; owner: string; due_in_days: number; detail: string }
export interface MitigationPlan { title: string; summary: string; steps: MitigationStep[]; estimated_cost_usd: number; risk_after: Severity }

export type OptionKind = "reroute" | "wait" | "mitigate" | "escalate"
export interface DecisionOption { id: string; label: string; kind: OptionKind; added_cost: number; added_days: number; added_co2_kg?: number; risk: Severity; route_candidate_id?: string | null; detail: string }
export interface Decision { supply_chain_id: string; event_id?: string | null; title: string; summary: string; options: DecisionOption[]; recommended_option_id: string; rationale: string; confidence: number; sources: Source[]; trace_id?: string | null }

export type DecisionStatus = "pending" | "approved" | "rejected" | "snoozed" | "expired"
export interface RoutePlanRow { id: string; decision_id: string; candidate_id: string; path: string[]; labels: string[]; modes: string[]; cost: number; transit_days: number; added_cost: number; added_days: number; max_risk: number; feasible: boolean }
export interface DecisionRow extends Decision {
  impact?: ImpactEstimate | null; memories?: string[]; auto_approved?: boolean; policy_reason?: string | null; id: string; user_id: string | null; chosen_option_id: string | null; status: DecisionStatus; created_at: string; decided_at: string | null; snoozed_until?: string | null; route_plans?: RoutePlanRow[] }

export interface GraphEvent { type: "node_start" | "node_end" | "tool" | "result" | "error"; node?: string | null; elapsed_ms?: number | null; payload?: Record<string, any> | null }

export interface IncidentResult {
  assessment: Assessment; plan: ReroutePlan | null; ranking: RouteRanking | null; impact: ImpactEstimate | null
  mitigation: MitigationPlan | null; decision: Decision | null; decision_id: string | null; notification_id: string | null
  trace_id: string; status: "decision" | "notified" | "partial"; execution_order: string[]; memories?: string[]
}

export interface Forecast { horizon: "7d" | "30d" | "90d"; risk_score: number; trend: "improving" | "stable" | "worsening"; drivers: string[]; summary: string }
export interface Scenario { id: string; title: string; description: string; disruption_type: string; failed_node_ids: string[]; probability: number; duration_days: number }
export interface AnalysisResult { forecast: Forecast | null; scenarios: { scenarios: Scenario[] } | null; report_markdown: string; trace_id: string; execution_order: string[]; steps: { node: string; status: string; elapsed_ms?: number | null }[] }
