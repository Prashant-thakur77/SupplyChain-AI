"use client"

import { useMemo, useState } from "react"
import { CheckCircle2, ChevronDown, Stethoscope } from "lucide-react"
import { useDigitalTwinStore } from "@/lib/digitalTwinStore"
import { lintTwin } from "@/lib/twin-lint"
import { cn } from "@/lib/utils"

/** Small "twin health" chip for the canvas: lint score + expandable issue list. */
export function TwinHealthChip({ className }: { className?: string }) {
  const nodes = useDigitalTwinStore((s) => s.nodes), edges = useDigitalTwinStore((s) => s.edges)
  const r = useMemo(() => lintTwin(nodes, edges), [nodes, edges])
  const [open, setOpen] = useState(false)
  if (nodes.length === 0) return null
  const tone = r.counts.error ? "border-theme-red/30 bg-theme-red-soft text-theme-red" : r.counts.warn ? "border-theme-amber/30 bg-theme-amber-soft text-theme-amber" : "border-theme-green/30 bg-theme-green-soft text-theme-green"
  return (
    <div className={cn("relative", className)}>
      <button type="button" onClick={() => setOpen((o) => !o)} className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold", tone)}>
        {r.issues.length ? <Stethoscope className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />} Data health {r.score}{r.issues.length ? ` · ${r.issues.length} issue${r.issues.length > 1 ? "s" : ""}` : ""}<ChevronDown className="h-3 w-3" />
      </button>
      {open && r.issues.length > 0 && (
        <ul className="absolute left-0 top-8 z-[60] max-h-64 w-80 overflow-y-auto rounded-theme-md border border-theme-border-subtle bg-theme-bg-surface p-2 text-xs shadow-xl">
          {r.issues.slice(0, 20).map((i, k) => <li key={k} className="border-b border-theme-border-subtle py-1.5 last:border-b-0"><span className={cn("mr-1 rounded px-1 text-[9px] font-bold uppercase", i.level === "error" ? "bg-theme-red-soft text-theme-red" : i.level === "warn" ? "bg-theme-amber-soft text-theme-amber" : "bg-theme-bg-secondary text-theme-text-muted")}>{i.level}</span><span className="text-theme-text-primary">{i.message}</span>{i.fix && <div className="text-theme-text-muted">→ {i.fix}</div>}</li>)}
        </ul>
      )}
    </div>
  )
}
