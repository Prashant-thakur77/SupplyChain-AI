"use client"

import { Route, Clock, Wrench, ArrowUpRight, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { summarizeOption } from "@/lib/decisions"
import type { DecisionOption } from "@/types/agent"
import { RISK_DOT } from "./severity"

const KIND_ICON = { reroute: Route, wait: Clock, mitigate: Wrench, escalate: ArrowUpRight } as const

interface Props {
  option: DecisionOption
  selected: boolean
  recommended: boolean
  chosen?: boolean
  disabled?: boolean
  onSelect: (id: string) => void
}

export function OptionRow({ option, selected, recommended, chosen, disabled, onSelect }: Props) {
  const Icon = KIND_ICON[option.kind] ?? Route
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelect(option.id)}
      aria-pressed={selected}
      className={cn(
        "group flex w-full items-start gap-3 rounded-theme-md border px-3 py-2.5 text-left transition-colors",
        selected ? "border-theme-blue bg-theme-blue-soft/60" : "border-theme-border-subtle bg-theme-bg-surface hover:border-theme-border-default",
        disabled && "cursor-default opacity-90",
      )}
    >
      <span className={cn("mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border", selected ? "border-theme-blue bg-theme-blue text-white" : "border-theme-border-default text-theme-text-secondary")}>
        {chosen ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="truncate text-sm font-semibold text-theme-text-primary">{option.label}</span>
          {recommended && <span className="rounded-full border border-theme-green/30 bg-theme-green-soft px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-theme-green">Recommended</span>}
          {chosen && <span className="rounded-full border border-theme-blue/30 bg-theme-blue-soft px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-theme-blue">Chosen</span>}
        </span>
        <span className="mt-0.5 flex items-center gap-1.5 text-xs text-theme-text-secondary">
          <span className={cn("inline-block h-1.5 w-1.5 rounded-full", RISK_DOT[option.risk])} />
          {summarizeOption(option)}
        </span>
        {option.detail && <span className="mt-1 block text-xs leading-relaxed text-theme-text-muted">{option.detail}</span>}
      </span>
    </button>
  )
}
