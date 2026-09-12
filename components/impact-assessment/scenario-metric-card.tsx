import { ReactNode } from "react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface ScenarioMetricCardProps {
  icon: ReactNode
  label: string
  value: string
  tooltipText: string
  iconBgColor: string
  iconColor: string
}

export default function ScenarioMetricCard({
  icon,
  label,
  value,
  tooltipText,
  iconBgColor,
  iconColor
}: ScenarioMetricCardProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-3 px-3 py-4 rounded-lg bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors shadow-md hover:shadow-lg transition-shadow">
            <div className={`flex-shrink-0 w-8 h-8 rounded-full ${iconBgColor} flex items-center justify-center`}>
              <div className={iconColor}>
                {icon}
              </div>
            </div>
            <div className="space-y-1 min-w-0 flex-1">
              <div className="text-sm font-medium text-muted-foreground">{label}</div>
              <div className="font-semibold text-sm truncate" title={value}>
                {value}
              </div>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs">{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
} 