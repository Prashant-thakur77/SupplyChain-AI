import { Building2, Network, Clock, Zap, Calculator, Target, Calendar } from "lucide-react"
import { MapPinIcon } from "@/components/icons/map-pin"
import { ChartSplineIcon } from "@/components/icons/chart-spline"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import ScenarioMetricCard from "./scenario-metric-card"

// Glassmorphic Card Component
function GlassmorphicCard({ children, className = "", ...props }: { children: React.ReactNode; className?: string; [key: string]: any }) {
  return (
    <Card 
      className={`border border-white/30 dark:border-slate-700/10 bg-white/70 dark:bg-slate-900/5 backdrop-blur-xl shadow-xl shadow-black/5 dark:shadow-black/20 rounded-xl ${className}`} 
      {...props}
    >
      {children}
    </Card>
  )
}

interface ScenarioInfoCardProps {
  scenario: any
  onOpenSheet: () => void
}

export default function ScenarioInfoCard({ scenario, onOpenSheet }: ScenarioInfoCardProps) {
  const firstRowMetrics = [
    {
      icon: <Network className="h-4 w-4" />,
      label: "Supply Chain",
      value: scenario?.supplyChain ? `Supply Chain ${scenario.supplyChain.slice(-6)}` : 'N/A',
      tooltipText: "The specific supply chain network being analyzed in this simulation scenario",
      iconBgColor: "bg-blue-100 dark:bg-blue-900/30",
      iconColor: "text-blue-600"
    },
    {
      icon: <MapPinIcon size={16} />,
      label: "Affected Node",
      value: scenario?.affectedNode || 'N/A',
      tooltipText: "The specific supply chain node(s) that are experiencing disruption in this scenario",
      iconBgColor: "bg-orange-100 dark:bg-orange-900/30",
      iconColor: "text-orange-600"
    },
    {
      icon: <Clock className="h-4 w-4" />,
      label: "Duration",
      value: scenario?.duration || 'N/A',
      tooltipText: "How long the disruption is expected to last, affecting supply chain operations",
      iconBgColor: "bg-green-100 dark:bg-green-900/30",
      iconColor: "text-green-600"
    },
    {
      icon: <Zap className="h-4 w-4" />,
      label: "Severity",
      value: scenario?.severity || 'N/A',
      tooltipText: "The intensity of the disruption impact, measured as a percentage of normal operations",
      iconBgColor: "bg-red-100 dark:bg-red-900/30",
      iconColor: "text-red-600"
    }
  ]

  const secondRowMetrics = [
    {
      icon: <Calculator className="h-4 w-4" />,
      label: "Monte Carlo Runs",
      value: scenario?.monteCarloRuns || 'N/A',
      tooltipText: "Number of simulation iterations run to calculate statistical outcomes and confidence intervals",
      iconBgColor: "bg-purple-100 dark:bg-purple-900/30",
      iconColor: "text-purple-600"
    },
    {
      icon: <Target className="h-4 w-4" />,
      label: "Cascading Threshold",
      value: scenario?.cascadingThreshold || 'N/A',
      tooltipText: "The failure percentage at which disruptions begin to cascade to connected supply chain nodes",
      iconBgColor: "bg-indigo-100 dark:bg-indigo-900/30",
      iconColor: "text-indigo-600"
    },
    {
      icon: <ChartSplineIcon size={16} />,
      label: "Inventory Buffer",
      value: scenario?.inventoryBuffer || 'N/A',
      tooltipText: "Extra inventory percentage maintained to absorb supply disruptions and maintain operations",
      iconBgColor: "bg-teal-100 dark:bg-teal-900/30",
      iconColor: "text-teal-600"
    },
    {
      icon: <Calendar className="h-4 w-4" />,
      label: "Last Updated",
      value: scenario?.lastUpdated || 'N/A',
      tooltipText: "When this simulation scenario was last modified or executed",
      iconBgColor: "bg-amber-100 dark:bg-amber-900/30",
      iconColor: "text-amber-600"
    }
  ]

  return (
    <GlassmorphicCard className=" dark:bg-slate-950 shadow-lg border-0">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-xl text-slate-900 dark:text-slate-100">{scenario?.name || 'Simulation Scenario'}</CardTitle>
            </div>
            <CardDescription className="text-base text-slate-600 dark:text-slate-400">
              {scenario?.description || 'No description available'}
            </CardDescription>
          </div>
          <Badge variant="destructive" className="px-3 py-1 text-sm">
            {scenario?.type?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {firstRowMetrics.map((metric, index) => (
            <ScenarioMetricCard key={index} {...metric} />
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {secondRowMetrics.map((metric, index) => (
            <ScenarioMetricCard key={index} {...metric} />
          ))}
        </div>

        <div className="pt-4 border-t">
          <Button 
            variant="link" 
            size="sm" 
            onClick={onOpenSheet} 
            className="text-[#1D3557] hover:text-[#1D3557]/80 dark:text-blue-400 dark:hover:text-blue-300 p-0 h-auto font-medium transition-all duration-300 dark:shadow-lg  dark:hover:shadow-xl dark:hover:shadow-blue-500/40 hover:scale-[1.02]"
          >
            View Disruption Strategy →
          </Button>
        </div>
      </CardContent>
    </GlassmorphicCard>
  )
} 