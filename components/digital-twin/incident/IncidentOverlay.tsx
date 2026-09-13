"use client"

import { useMemo, useState } from "react"
import { ChevronDown, ChevronUp, X } from "lucide-react"
import { AgentActivityPanel } from "@/components/agent-activity/AgentActivityPanel"
import { DecisionCard } from "@/components/decisions/decision-card"
import { useDigitalTwinStore } from "@/lib/digitalTwinStore"
import { cn } from "@/lib/utils"
import type { DecisionRow, IncidentResult } from "@/types/agent"
import { routeColor } from "./route-colors"

function Stat({ label, value, tone }: { label: string; value: string; tone: "amber" | "green" | "red" }) {
  const cls = { amber: "border-theme-amber/30 bg-theme-amber-soft text-theme-amber", green: "border-theme-green/30 bg-theme-green-soft text-theme-green", red: "border-theme-red/30 bg-theme-red-soft text-theme-red" }[tone]
  return (
    <div className={cn("rounded-theme-md border px-2.5 py-2", cls)}>
      <div className="text-lg font-bold leading-tight">{value}</div>
      <div className="text-[10px] font-medium uppercase tracking-wide opacity-80">{label}</div>
    </div>
  )
}

/** Turn a streamed IncidentResult into the row shape the DecisionCard renders. */
export function toDecisionRow(r: IncidentResult, userId = "demo"): DecisionRow | null {
  if (!r.decision) return null
  const d = r.decision as any
  return { ...r.decision, id: r.decision_id ?? `local-${r.trace_id}`, user_id: d.user_id ?? userId, chosen_option_id: d.chosen_option_id ?? null, status: d.status ?? "pending", created_at: d.created_at ?? new Date().toISOString(), decided_at: d.decided_at ?? null, memories: r.memories ?? d.memories ?? [] }
}

interface Props {
  onClose: () => void
  /** When true the approve button is local-only (demo). */
  local?: boolean
  className?: string
}

export function IncidentOverlay({ onClose, local, className }: Props) {
  const incident = useDigitalTwinStore((s) => s.incident)
  const events = useDigitalTwinStore((s) => s.incidentEvents)
  const status = useDigitalTwinStore((s) => s.incidentStatus)
  const error = useDigitalTwinStore((s) => s.incidentError)
  const replayed = useDigitalTwinStore((s) => s.incidentReplayed)
  const selectedRouteId = useDigitalTwinStore((s) => s.selectedRouteId)
  const setSelectedRouteId = useDigitalTwinStore((s) => s.setSelectedRouteId)
  const [collapsed, setCollapsed] = useState(false)
  const [decided, setDecided] = useState<DecisionRow | null>(null)
  const row = useMemo(() => (incident ? toDecisionRow(incident) : null), [incident])
  const shown = decided ?? row
  const ranked = incident?.ranking?.ranked_candidate_ids ?? []
  const visible = status !== "idle" || !!incident
  if (!visible) return null

  return (
    <aside className={cn("pointer-events-auto flex max-h-[calc(100vh-7rem)] w-full flex-col overflow-hidden rounded-theme-lg border border-theme-border-default bg-theme-bg-surface/95 shadow-2xl backdrop-blur sm:w-[420px]", className)}>
      <header className="flex items-center gap-2 border-b border-theme-border-subtle px-3 py-2">
        <span className="text-sm font-semibold text-theme-text-primary">Incident response</span>
        {incident && <span className="rounded-full border border-theme-border-subtle px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-theme-text-secondary">{incident.assessment.severity}</span>}
        {replayed && <span title={`Model rate-limited — replaying a run recorded ${new Date(replayed).toLocaleString()}`} className="rounded-full border border-theme-amber/30 bg-theme-amber-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-theme-amber">replay</span>}
        <button type="button" className="ml-auto rounded p-1 text-theme-text-muted hover:text-theme-text-primary" onClick={() => setCollapsed((c) => !c)} aria-label={collapsed ? "Expand" : "Collapse"}>{collapsed ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</button>
        <button type="button" className="rounded p-1 text-theme-text-muted hover:text-theme-text-primary" onClick={onClose} aria-label="Close"><X className="h-4 w-4" /></button>
      </header>
      {!collapsed && (
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
          {incident && (
            <div className="grid grid-cols-3 gap-2">
              <Stat label="Downstream" value={String(incident.assessment.affected_node_ids.length)} tone="amber" />
              <Stat label="Lanes reroutable" value={`${incident.plan?.feasible_count ?? 0}/${(incident.plan?.feasible_count ?? 0) + (incident.plan?.infeasible_count ?? 0)}`} tone="green" />
              <Stat label="Revenue at risk" value={incident.impact ? `$${Math.round(incident.impact.revenue_at_risk_usd / 1000)}k` : "—"} tone="red" />
              {!!incident.impact?.contract_penalties_usd && <Stat label="SLA penalties" value={`$${Math.round(incident.impact.contract_penalties_usd / 1000)}k`} tone="amber" />}
            </div>
          )}
          <AgentActivityPanel events={events} status={status} error={error} compact />
          {incident?.plan && ranked.length > 0 && (
            <div className="rounded-theme-md border border-theme-border-subtle p-2.5">
              <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-theme-text-muted">Routes on the twin</div>
              <ul className="space-y-1">
                {ranked.slice(0, 3).map((cid, i) => {
                  const c = incident.plan!.candidates.find((x) => x.id === cid)
                  if (!c) return null
                  const active = selectedRouteId === cid
                  return (
                    <li key={cid}>
                      <button type="button" onClick={() => setSelectedRouteId(cid)} className={cn("flex w-full items-center gap-2 rounded px-2 py-1 text-left text-xs transition-colors", active ? "bg-theme-bg-secondary text-theme-text-primary" : "text-theme-text-secondary hover:bg-theme-bg-secondary/60")}>
                        <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: routeColor(i) }} />
                        <span className="truncate">{c.labels.join(" → ")}</span>
                        <span className="ml-auto shrink-0 font-mono">+${Math.round(c.added_cost).toLocaleString()} · +{Math.round(c.added_days)}d</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
          {shown && <DecisionCard decision={shown} local={local || !incident?.decision_id} onChange={(d) => { setDecided(d); if (d.chosen_option_id) setSelectedRouteId(d.chosen_option_id) }} />}
          {incident && !shown && (
            <div className="rounded-theme-md border border-theme-border-subtle bg-theme-bg-secondary p-3 text-sm text-theme-text-secondary">
              Assessed as <strong>{incident.assessment.severity}</strong> (confidence {Math.round(incident.assessment.confidence * 100)}%). Logged as an alert — below the decision threshold, so nobody was interrupted.
            </div>
          )}
        </div>
      )}
    </aside>
  )
}
