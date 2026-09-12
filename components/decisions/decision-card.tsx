"use client"

import { useState } from "react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { Activity, AlarmClock, Check, ExternalLink, MapPinned, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { GroundingBadge } from "@/components/ui/grounding-badge"
import { cn } from "@/lib/utils"
import { decide } from "@/lib/decisions"
import type { DecisionRow, Severity } from "@/types/agent"
import { OptionRow } from "./option-row"
import { SEVERITY_STYLES } from "./severity"
import { TraceDrawer } from "./trace-drawer"

function severityOf(d: DecisionRow): Severity {
  const risks = d.options.map((o) => o.risk)
  if (d.title.includes("no full bypass")) return "CRITICAL"
  if (risks.includes("HIGH") || d.confidence >= 0.85) return "HIGH"
  return "MEDIUM"
}

interface Props {
  decision: DecisionRow
  onChange?: (d: DecisionRow) => void
  /** Demo mode: no server round-trip. */
  local?: boolean
}

export function DecisionCard({ decision, onChange, local }: Props) {
  const [selected, setSelected] = useState<string>(decision.chosen_option_id ?? decision.recommended_option_id)
  const [busy, setBusy] = useState<null | "approved" | "rejected" | "snoozed">(null)
  const [traceOpen, setTraceOpen] = useState(false)
  const pending = decision.status === "pending" || decision.status === "snoozed"
  const sev = SEVERITY_STYLES[severityOf(decision)]
  const chosen = decision.options.find((o) => o.id === decision.chosen_option_id)

  async function act(status: "approved" | "rejected" | "snoozed") {
    setBusy(status)
    try {
      if (local) {
        onChange?.({ ...decision, status, chosen_option_id: status === "approved" ? selected : null, decided_at: new Date().toISOString() })
      } else {
        const { decision: updated } = await decide(decision.id, status, status === "approved" ? selected : null, 24)
        onChange?.(updated)
      }
      const opt = decision.options.find((o) => o.id === selected)
      toast.success(status === "approved" ? `Approved: ${opt?.label ?? "option"}` : status === "rejected" ? "Decision rejected" : "Snoozed for 24 hours")
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setBusy(null)
    }
  }

  return (
    <article className={cn("relative overflow-hidden rounded-theme-lg border border-theme-border-subtle bg-theme-bg-surface shadow-sm", !pending && "opacity-90")}>
      <div className={cn("absolute inset-y-0 left-0 w-1", sev.stripe)} aria-hidden />
      <div className="p-4 pl-5 sm:p-5 sm:pl-6">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", sev.chip)}>{sev.label}</span>
              <span className="text-xs text-theme-text-muted">{formatDistanceToNow(new Date(decision.created_at), { addSuffix: true })}</span>
              {decision.status !== "pending" && <span className="rounded-full border border-theme-border-default px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-theme-text-secondary">{decision.status}</span>}
            </div>
            <h3 className="mt-2 font-display text-lg font-semibold leading-snug text-theme-text-primary sm:text-xl">{decision.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-theme-text-secondary">{decision.summary}</p>
          </div>
          <GroundingBadge grounding={{ hasGrounding: true, confidence: decision.confidence, level: decision.confidence >= 0.75 ? "high" : decision.confidence >= 0.5 ? "medium" : "low", needsReview: decision.confidence < 0.6 || (decision.sources?.length ?? 0) === 0, sourceCount: decision.sources?.length ?? 0, avgCredibility: null }} compact />
        </header>

        <div className="mt-4 space-y-2">
          {decision.options.map((o) => (
            <OptionRow key={o.id} option={o} selected={pending ? selected === o.id : o.id === decision.chosen_option_id} recommended={o.id === decision.recommended_option_id}
              chosen={o.id === decision.chosen_option_id} disabled={!pending} onSelect={setSelected} />
          ))}
        </div>

        <div className="mt-4 rounded-theme-md border border-theme-border-subtle bg-theme-bg-secondary p-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-theme-text-muted">Why the agent recommends this</div>
          <p className="mt-1 text-sm leading-relaxed text-theme-text-secondary">{decision.rationale}</p>
          {decision.sources?.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-2">
              {decision.sources.slice(0, 4).map((s, i) => (
                <li key={i}><a href={s.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full border border-theme-border-subtle bg-theme-bg-surface px-2 py-0.5 text-[11px] text-theme-text-secondary hover:text-theme-blue"><ExternalLink className="h-3 w-3" />{s.title || new URL(s.url).hostname}</a></li>
              ))}
            </ul>
          )}
        </div>

        <footer className="mt-4 flex flex-wrap items-center gap-2">
          {pending ? (
            <>
              <Button size="sm" onClick={() => act("approved")} disabled={!!busy} className="gap-1.5"><Check className="h-4 w-4" /> Approve{selected !== decision.recommended_option_id ? " selected" : ""}</Button>
              <Button size="sm" variant="outline" onClick={() => act("rejected")} disabled={!!busy} className="gap-1.5"><X className="h-4 w-4" /> Reject</Button>
              <Button size="sm" variant="ghost" onClick={() => act("snoozed")} disabled={!!busy} className="gap-1.5"><AlarmClock className="h-4 w-4" /> Snooze 24h</Button>
            </>
          ) : (
            <span className="text-sm text-theme-text-secondary">{decision.status === "approved" ? `Approved → ${chosen?.label ?? "option"}` : decision.status === "rejected" ? "Rejected" : decision.status}{decision.decided_at ? ` · ${formatDistanceToNow(new Date(decision.decided_at), { addSuffix: true })}` : ""}</span>
          )}
          <span className="ml-auto flex items-center gap-1">
            {decision.trace_id && <Button size="sm" variant="ghost" className="gap-1.5 text-theme-text-secondary" onClick={() => setTraceOpen(true)}><Activity className="h-4 w-4" /> Trace</Button>}
            {!local && <Button asChild size="sm" variant="ghost" className="gap-1.5 text-theme-text-secondary"><Link href={`/digital-twin/view/${decision.supply_chain_id}?decision=${decision.id}`}><MapPinned className="h-4 w-4" /> View on twin</Link></Button>}
          </span>
        </footer>
      </div>
      {decision.trace_id && <TraceDrawer traceId={decision.trace_id} open={traceOpen} onOpenChange={setTraceOpen} />}
    </article>
  )
}
