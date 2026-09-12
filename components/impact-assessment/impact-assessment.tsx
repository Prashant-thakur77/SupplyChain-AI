"use client"

import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { useQueryState, parseAsString } from "nuqs"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import StrategyDashboard from "@/components/strategy-dashboard"
import { useImpact } from "@/lib/context/impact-context"
import MetricsDashboard from "@/components/metrics-dashboard"

import ScenarioInfoCard from "./scenario-info-card"
import CriticalAlert from "./critical-alert"
import ImpactAssessmentLoading from "./impact-assessment-loading"
import { Card } from "../ui/card"

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

export default function ImpactAssessment() {
  const { toast } = useToast()
  const { impactData, isLoading } = useImpact()
  const [isRunning, setIsRunning] = useState(false)
  const [scenarioId, setScenarioId] = useState("PORT-CLOSURE-Q3-25")
  const [activeTab, setActiveTab] = useState("metrics")
  
  // URL state management with nuqs - using 'impactView' to avoid conflicts with simulation page
  const [impactView, setImpactView] = useQueryState('impactView', parseAsString.withDefault('analysis'))

  const handleOpenStrategy = () => {
    setImpactView('strategy')
  }

  const handleBackToImpact = () => {
    setImpactView('analysis')
  }

  const runSimulation = () => {
    setIsRunning(true)
    toast({
      title: "Simulation started",
      description: "Running 100 Monte Carlo simulations...",
    })

    setTimeout(() => {
      setIsRunning(false)
      toast({
        title: "Simulation complete",
        description: "All 100 simulations completed successfully.",
      })
    }, 3000)
  }

  // Use the scenario data from the context, with null check
  const scenario = impactData?.scenario || {}

  if (isLoading) {
    return <ImpactAssessmentLoading />
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "metrics":
        return <MetricsDashboard />
      case "summary":
        return (
          <div className="space-y-6">
            <div className="p-6 bg-slate-50/50 dark:bg-slate-800/30 rounded-lg border border-slate-200/50 dark:border-slate-700/30">
              <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-100">Key Impact Points</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm leading-relaxed">Primary disruption at Shanghai Port affects 60% of inbound shipments</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm leading-relaxed">Alternative routing through Hong Kong reduces impact by 25%</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm leading-relaxed">Inventory buffers insufficient for disruptions longer than 14 days</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm leading-relaxed">Electronics and automotive sectors show highest vulnerability</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm leading-relaxed">Recovery timeline extends beyond Q3 projections by 2 weeks</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm leading-relaxed">Backup suppliers can handle 40% of disrupted capacity with 3-day lead time</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg border border-blue-200/50 dark:border-blue-800/30">
              <h3 className="text-lg font-semibold mb-4 text-blue-900 dark:text-blue-100">Financial Impact Summary</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm leading-relaxed">Direct operational costs increased by $1.2M due to expedited shipping</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm leading-relaxed">Lost sales revenue estimated at $800K from delayed product launches</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm leading-relaxed">Additional storage costs of $400K for rerouted inventory</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm leading-relaxed">Labor overtime costs of $300K for accelerated recovery operations</p>
                </div>
              </div>
            </div>
          </div>
        )
      default:
        return <MetricsDashboard />
    }
  }

  // Show strategy dashboard view
  if (impactView === 'strategy') {
    return (
      <div className="w-full">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={handleBackToImpact}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Impact Analysis
          </Button>
        </div>
        <StrategyDashboard scenarioId={scenarioId} />
      </div>
    )
  }

  // Show main impact assessment view
  return (
    <div className="px-4 py-4 space-y-4">
      <ScenarioInfoCard scenario={scenario} onOpenSheet={handleOpenStrategy} />

      <GlassmorphicCard className="dark:bg-slate-950 backdrop-blur-sm border-0 rounded-xl p-6 shadow-lg shadow-black/5 ">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Impact Analysis</h2>
            <p className="text-slate-600 dark:text-slate-400">Real-time supply chain performance metrics</p>
          </div>
          <div className="flex items-center gap-2 bg-muted/80 p-2 rounded-lg shadow-inner border border-border/30">
            {[
              { value: "metrics", label: "Metrics", icon: "📊" },
              { value: "summary", label: "Summary", icon: "�" },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        
        {renderTabContent()}
      </GlassmorphicCard>

      <CriticalAlert />
    </div>
  )
} 