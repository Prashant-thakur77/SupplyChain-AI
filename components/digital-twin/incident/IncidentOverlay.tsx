"use client"

import { useMemo, useState } from "react"
import { ChevronDown, ChevronUp, X } from "lucide-react"
import { AgentActivityPanel } from "@/components/agent-activity/AgentActivityPanel"
import type { ActivityEvent, StreamStatus } from "@/components/agent-activity/useGraphStream"
import { DecisionCard } from "@/components/decisions/decision-card"
import { useDigitalTwinStore } from "@/lib/digitalTwinStore"
import { cn } from "@/lib/utils"
import type { DecisionRow, IncidentResult } from "@/types/agent"
import { routeColor } from "./route-colors"

/** Turn a streamed IncidentResult into the row shape the DecisionCard renders. */
export function toDecisionRow(r: IncidentResult, userId = "demo"): DecisionRow | null {
  if (!r.decision) return null
  return { ...r.decision, id: r.decision_id ?? `local-${r.trace_id}`, user_id: userId, chosen_option_id: null, status: "pending", created_at: new Date().toISOString(), decided_at: null }
}

interface Props {
  events: ActivityEvent[]
  status: StreamStatus
  error?: string | null
  onClose: () => void
  /** When true the approve button is local-only (demo). */
  local?: boolean
  className?: string
}

export function IncidentOverlay({ events, status, error, onClose, local, className }: Props) {
  const incident = useDigitalTwinStore((s) => s.incident)
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
        <button type="button" className="ml-auto rounded p-1 text-theme-text-muted hover:text-theme-text-primary" onClick={() => setCollapsed((c) => !c)} aria-label={collapsed ? "Expand" : "Collapse"}>{collapsed ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</button>
        <button type="button" className="rounded p-1 text-theme-text-muted hover:text-theme-text-primary" onClick={onClose} aria-label="Close"><X className="h-4 w-4" /></button>
      </header>
      {!collapsed && (
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
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
