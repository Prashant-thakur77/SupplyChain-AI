"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, Bot, X } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AgentActivityPanel } from "@/components/agent-activity/AgentActivityPanel"
import { useGraphStream } from "@/components/agent-activity/useGraphStream"
import type { AnalysisResult } from "@/types/agent"

interface IntelligenceAnalysisDialogProps {
  isOpen: boolean
  onClose: () => void
  supplyChainId: string | null
}

/** Runs the Strands analysis graph (intel → forecast ∥ scenario → strategy → report) for a freshly saved twin. */
export default function IntelligenceAnalysisDialog({ isOpen, onClose, supplyChainId }: IntelligenceAnalysisDialogProps) {
  const router = useRouter()
  const stream = useGraphStream()
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const started = useRef<string | null>(null)

  useEffect(() => {
    if (!isOpen || !supplyChainId || started.current === supplyChainId) return
    started.current = supplyChainId
    setResult(null)
    stream.start<AnalysisResult>("/api/agent/analysis", { supplyChainId, query: "Initial resilience review of this newly modelled supply chain: current external situation, 30-day forecast, top scenarios and recommended actions." })
      .then((r) => { if (r) setResult(r) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, supplyChainId])

  useEffect(() => { if (!isOpen) { started.current = null; stream.reset(); setResult(null) } }, [isOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Bot className="h-5 w-5 text-theme-blue" /> Intelligence briefing</DialogTitle>
          <DialogDescription>Your twin is saved. The analysis graph is reviewing it now — this takes about a minute. You can open the twin at any time.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 md:grid-cols-[260px_1fr]">
          <AgentActivityPanel events={stream.events} status={stream.status} error={stream.error} />
          <div className="min-h-[200px] rounded-theme-lg border border-theme-border-subtle bg-theme-bg-surface p-4 text-sm">
            {result?.report_markdown ? (
              <div className="prose prose-sm max-w-none dark:prose-invert [&_h2]:mt-3 [&_h2]:text-base [&_p]:my-1 [&_ul]:my-1"><ReactMarkdown remarkPlugins={[remarkGfm]}>{result.report_markdown}</ReactMarkdown></div>
            ) : stream.status === "error" ? (
              <p className="text-theme-red">{stream.error}</p>
            ) : (
              <p className="text-theme-text-muted">The report will appear here when the graph finishes.</p>
            )}
            {result?.forecast && (
              <div className="mt-3 rounded-theme-md border border-theme-border-subtle bg-theme-bg-secondary p-3">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-theme-text-muted">30-day forecast</div>
                <div className="mt-1 text-sm text-theme-text-primary">Risk {Math.round(result.forecast.risk_score)}/100 · {result.forecast.trend}</div>
                <ul className="mt-1 list-disc pl-4 text-xs text-theme-text-secondary">{result.forecast.drivers.slice(0, 4).map((d, i) => <li key={i}>{d}</li>)}</ul>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="ghost" onClick={onClose} className="gap-1.5"><X className="h-4 w-4" /> Close</Button>
          <Button onClick={() => { onClose(); if (supplyChainId) router.push(`/digital-twin?twinId=${supplyChainId}`) }} className="gap-1.5">Open twin <ArrowRight className="h-4 w-4" /></Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
