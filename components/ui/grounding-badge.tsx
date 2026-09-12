"use client"

import { ShieldCheck, ShieldAlert, Globe, TriangleAlert } from "lucide-react"
import { getGrounding, confidencePct, type Grounding } from "@/lib/grounding"
import type { NotificationCitations } from "@/components/dashboard/notification-feed/types"

const LEVEL_STYLES: Record<Grounding["level"], string> = {
  high: "border-theme-green/30 bg-theme-green-soft text-theme-green",
  medium: "border-theme-amber/30 bg-theme-amber-soft text-theme-amber",
  low: "border-theme-red/30 bg-theme-red-soft text-theme-red",
}

interface GroundingBadgeProps {
  citations?: NotificationCitations | null
  grounding?: Grounding
  /** Compact = a single chip for dense card rows. Full = a chip row for modals. */
  compact?: boolean
  className?: string
}

/**
 * Shows how well an AI claim is grounded: a confidence score (colored by level),
 * the number of cited sources, and a "Needs review" flag for weak claims.
 */
export function GroundingBadge({ citations, grounding, compact = false, className = "" }: GroundingBadgeProps) {
  const g = grounding ?? getGrounding(citations)
  if (!g.hasGrounding && !g.needsReview) return null

  const Icon = g.level === "high" ? ShieldCheck : ShieldAlert

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 ${className}`}>
        <span
          className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[0.6rem] font-bold tracking-wide ${LEVEL_STYLES[g.level]}`}
          title={`AI confidence: ${confidencePct(g)}${g.sourceCount ? ` · ${g.sourceCount} source${g.sourceCount > 1 ? "s" : ""}` : ""}`}
        >
          <Icon className="h-3 w-3" />
          {confidencePct(g)}
        </span>
        {g.needsReview && (
          <span
            className="inline-flex items-center gap-0.5 rounded-full border border-theme-amber/30 bg-theme-amber-soft px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide text-theme-amber"
            title="Weakly grounded — review before acting"
          >
            <TriangleAlert className="h-3 w-3" />
            Review
          </span>
        )}
      </span>
    )
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${LEVEL_STYLES[g.level]}`}>
        <Icon className="h-3.5 w-3.5" />
        AI confidence {confidencePct(g)}
      </span>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
        <Globe className="h-3.5 w-3.5" />
        {g.sourceCount} source{g.sourceCount === 1 ? "" : "s"}
      </span>
      {g.needsReview && (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-theme-amber/30 bg-theme-amber-soft px-2.5 py-1 text-xs font-semibold text-theme-amber">
          <TriangleAlert className="h-3.5 w-3.5" />
          Needs review
        </span>
      )}
    </div>
  )
}
