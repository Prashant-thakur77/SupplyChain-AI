"use client"

import { useEffect, useState } from "react"
import { PiggyBank, TrendingUp } from "lucide-react"
import { getUserData } from "@/utils/functions/userUtils"
import type { Digest } from "@/lib/digest"
import { cn } from "@/lib/utils"

/** "What did the agent save this week?" — the CFO card. */
export function DigestCard({ className }: { className?: string }) {
  const [d, setD] = useState<Digest | null>(null)
  useEffect(() => { getUserData().then((u) => u?.id && fetch(`/api/reports/digest?userId=${u.id}&days=7`).then((r) => r.json()).then(setD)).catch(() => undefined) }, [])
  if (!d) return null
  const money = (n: number) => `$${Math.round(n).toLocaleString()}`
  return (
    <div data-tour="digest" className={cn("rounded-theme-lg border border-theme-border-subtle bg-theme-bg-surface p-4", className)}>
      <div className="flex items-center gap-2"><PiggyBank className="h-4 w-4 text-theme-green" /><h3 className="text-sm font-semibold text-theme-text-primary">Last 7 days</h3><span className="ml-auto text-[11px] text-theme-text-muted">cost of inaction avoided</span></div>
      <div className="mt-2 flex items-end gap-3"><span className="font-display text-3xl font-semibold text-theme-green">{money(d.avoided_usd)}</span><span className="pb-1 text-xs text-theme-text-secondary">vs {money(d.spent_on_reroutes_usd)} spent on reroutes · {money(d.est_model_cost_usd)} in model cost</span></div>
      <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
        {[["incidents", d.incidents], ["approved", d.approved], ["by policy", d.auto_approved], ["pending", d.pending]].map(([l, v]) => <div key={l as string} className="rounded-theme-md bg-theme-bg-secondary py-1.5"><div className="text-base font-semibold text-theme-text-primary">{v as number}</div><div className="text-[10px] uppercase tracking-wide text-theme-text-muted">{l}</div></div>)}
      </div>
      {d.top[0] && <div className="mt-3 flex items-start gap-1.5 text-xs text-theme-text-secondary"><TrendingUp className="mt-0.5 h-3.5 w-3.5 text-theme-green" /><span><strong className="text-theme-text-primary">{d.top[0].title}</strong> → {d.top[0].chosen} · avoided ≈ {money(d.top[0].avoided_usd)}</span></div>}
    </div>
  )
}
