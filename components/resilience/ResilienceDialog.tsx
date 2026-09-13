"use client"

import { useState } from "react"
import { ShieldCheck } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ResiliencePanel, type ResilienceReport } from "./ResiliencePanel"
import type { IncidentEvent } from "@/types/agent"
import { cn } from "@/lib/utils"

/** Compact launcher + full-width dialog for the resilience audit. */
export function ResilienceDialog({ fetchReport, onFail, className, label = "Resilience audit" }: { fetchReport: () => Promise<ResilienceReport>; onFail?: (e: IncidentEvent) => void; className?: string; label?: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={cn("inline-flex w-full items-center justify-center gap-2 rounded-theme-md border border-theme-border-subtle bg-theme-bg-surface px-3 py-2 text-sm font-medium text-theme-text-primary transition-colors hover:border-theme-blue hover:text-theme-blue", className)}>
        <ShieldCheck className="h-4 w-4" /> {label}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-theme-blue" /> Where is this network fragile?</DialogTitle><DialogDescription>Every site and lane is failed one at a time by the routing engine — no model involved — and ranked by how much it would hurt. "Fail it" runs the full incident graph for that case.</DialogDescription></DialogHeader>
          <ResiliencePanel fetchReport={fetchReport} onFail={onFail ? (e) => { setOpen(false); onFail(e) } : undefined} />
        </DialogContent>
      </Dialog>
    </>
  )
}
