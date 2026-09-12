import type { Severity } from "@/types/agent"

export const SEVERITY_STYLES: Record<Severity, { stripe: string; chip: string; label: string }> = {
  CRITICAL: { stripe: "bg-theme-red", chip: "border-theme-red/30 bg-theme-red-soft text-theme-red", label: "Critical" },
  HIGH: { stripe: "bg-theme-amber", chip: "border-theme-amber/30 bg-theme-amber-soft text-theme-amber", label: "High" },
  MEDIUM: { stripe: "bg-theme-blue", chip: "border-theme-blue/30 bg-theme-blue-soft text-theme-blue", label: "Medium" },
  LOW: { stripe: "bg-theme-green", chip: "border-theme-green/30 bg-theme-green-soft text-theme-green", label: "Low" },
}

export const RISK_DOT: Record<Severity, string> = {
  CRITICAL: "bg-theme-red", HIGH: "bg-theme-amber", MEDIUM: "bg-theme-blue", LOW: "bg-theme-green",
}
