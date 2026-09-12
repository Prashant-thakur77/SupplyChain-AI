// Grounding / trust layer for AI-generated notifications.
// Turns raw citation data (sources, credibility, model confidence) into a single
// trust assessment the UI can render: a confidence score, a level, and whether a
// human should review the claim before acting on it.

import type { NotificationCitations } from "@/components/dashboard/notification-feed/types"

export type GroundingLevel = "high" | "medium" | "low"

export interface Grounding {
  /** Whether we have anything to stand behind the claim (a confidence or ≥1 source). */
  hasGrounding: boolean
  /** 0–1 confidence, or null if unknown. */
  confidence: number | null
  level: GroundingLevel
  /** True when the claim is weakly grounded and a human should verify before acting. */
  needsReview: boolean
  sourceCount: number
  /** Average source credibility (0–1), or null. */
  avgCredibility: number | null
}

const clamp01 = (n: number) => Math.max(0, Math.min(1, n))

// Below this we ask a human to review before acting on the claim.
const REVIEW_THRESHOLD = 0.6

export function getGrounding(citations?: NotificationCitations | null): Grounding {
  const sources = citations?.sources ?? []
  const sourceCount = sources.length

  const creds = sources
    .map((s) => (typeof s?.credibility === "number" ? s.credibility : null))
    .filter((n): n is number => n != null)
  const avgCredibility = creds.length
    ? clamp01(creds.reduce((a, b) => a + b, 0) / creds.length)
    : null

  // Prefer an explicit model confidence; otherwise fall back to source credibility.
  let confidence: number | null = null
  if (typeof citations?.confidence === "number") confidence = clamp01(citations.confidence)
  else if (avgCredibility != null) confidence = avgCredibility

  const hasGrounding = confidence != null || sourceCount > 0
  const level: GroundingLevel =
    confidence == null ? "low" : confidence >= 0.75 ? "high" : confidence >= 0.5 ? "medium" : "low"
  const needsReview = sourceCount === 0 || confidence == null || confidence < REVIEW_THRESHOLD

  return { hasGrounding, confidence, level, needsReview, sourceCount, avgCredibility }
}

export function confidencePct(g: Grounding): string {
  return g.confidence == null ? "—" : `${Math.round(g.confidence * 100)}%`
}
