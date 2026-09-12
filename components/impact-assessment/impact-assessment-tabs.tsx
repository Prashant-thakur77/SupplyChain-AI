import { useState } from "react"
import { BarChart3, Network, Route, Info } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import CascadingFailureMap from "@/components/cascading-failure-map"
import MetricsDashboard from "@/components/metrics-dashboard"
import NodeImpactGrid from "@/components/node-impact-grid"

interface ImpactAssessmentTabsProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export default function ImpactAssessmentTabs({ activeTab, onTabChange }: ImpactAssessmentTabsProps) {
  const tabs = [
    { value: "metrics", label: "Metrics Dashboard", icon: <BarChart3 className="h-4 w-4" /> },
    { value: "nodes", label: "Node-Level Impact", icon: <Network className="h-4 w-4" /> },
    { value: "map", label: "Cascading Failure Map", icon: <Route className="h-4 w-4" /> },
  ]

  return (
    <div className="space-y-8">
      {/* Enhanced Tab Navigation */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10 rounded-2xl blur-xl"></div>
        <div className="relative bg-background/80 backdrop-blur-xl border border-border/50 rounded-2xl p-6 shadow-2xl shadow-black/10">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 rounded-2xl"></div>
          <Tabs value={activeTab} onValueChange={onTabChange} className="relative w-fit">
            <TabsList className="bg-muted/60 backdrop-blur-sm p-2 rounded-xl shadow-lg shadow-black/10 border border-border/30 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-white/10"></div>
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="flex items-center gap-2 relative z-10 data-[state=active]:bg-background/90 data-[state=active]:shadow-lg data-[state=active]:shadow-black/20 data-[state=active]:border data-[state=active]:border-border/50 transition-all duration-300 hover:bg-background/50"
                >
                  {tab.icon}
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>
      
      {/* Enhanced Content Areas */}
      {activeTab === "metrics" && (
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-blue-500/5 rounded-2xl blur-2xl"></div>
          <div className="relative bg-background/50 backdrop-blur-sm rounded-2xl p-6 shadow-2xl shadow-black/10 border border-border/30">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 rounded-2xl"></div>
            <div className="relative z-10">
              <MetricsDashboard />
            </div>
          </div>
        </div>
      )}
      
      {activeTab === "nodes" && (
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5 rounded-2xl blur-2xl"></div>
          <div className="relative bg-background/50 backdrop-blur-sm rounded-2xl p-6 shadow-2xl shadow-black/10 border border-border/30">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 rounded-2xl"></div>
            <div className="relative z-10">
              <NodeImpactGrid />
            </div>
          </div>
        </div>
      )}
      
      {activeTab === "map" && (
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-red-500/5 rounded-2xl blur-2xl"></div>
          <Card className="relative bg-background/80 backdrop-blur-xl border-border/50 shadow-2xl shadow-black/10 rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5"></div>
            <CardHeader className="relative z-10 pb-4">
              <CardTitle className="flex items-center text-xl font-semibold">
                Cascading Failure Map
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="ml-3 p-1.5 rounded-full bg-muted/50 hover:bg-muted/80 transition-colors cursor-help shadow-sm">
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs p-4 bg-background/95 backdrop-blur-sm border shadow-xl">
                      <p className="text-sm leading-relaxed">
                        This network graph shows how disruptions cascade through your supply chain. Red nodes have
                        failed, yellow nodes are partially affected, and green nodes are operating normally.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
              <CardDescription className="text-muted-foreground/80">
                Interactive visualization of disruption propagation across the network
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10 p-6 pt-0">
              <div className="h-[500px] w-full rounded-xl bg-muted/20 backdrop-blur-sm border border-border/30 shadow-inner shadow-black/5 overflow-hidden">
                <CascadingFailureMap />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
} 