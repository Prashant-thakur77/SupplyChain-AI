"use client"

import { Calendar, Clock, Play, ChevronRight, Activity, CheckCircle, XCircle, Loader2, BarChart3, TrendingUp, AlertTriangle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Simulation } from "@/lib/types/database"

interface SimulationHistoryProps {
  simulations: Simulation[]
  onRunSimulation: (simulationId: string) => void
}

export function SimulationHistory({ simulations, onRunSimulation }: SimulationHistoryProps) {
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
  }

  // Get status configuration
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "completed":
        return {
          variant: "default" as const,
          className: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/20"
        }
      case "failed":
        return {
          variant: "destructive" as const,
          className: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20"
        }
      case "running":
        return {
          variant: "secondary" as const,
          className: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/20"
        }
      default:
        return {
          variant: "outline" as const,
          className: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900/20"
        }
    }
  }

  // Get scenario type icon and color
  const getScenarioTypeConfig = (scenarioType: string) => {
    switch (scenarioType) {
      case "disruption":
        return { icon: AlertTriangle, color: "text-orange-500" }
      case "natural":
        return { icon: Activity, color: "text-red-500" }
      case "political":
        return { icon: BarChart3, color: "text-purple-500" }
      case "demand":
        return { icon: TrendingUp, color: "text-green-500" }
      default:
        return { icon: Activity, color: "text-blue-500" }
    }
  }

  if (simulations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4">
        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
          <BarChart3 className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-base font-medium mb-1">No Simulation History</h3>
        <p className="text-xs text-muted-foreground text-center max-w-sm">
          Run your first simulation to see results here.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3 h-full">
      <div>
        <h3 className="text-base font-semibold">Recent Simulations</h3>
        <p className="text-xs text-muted-foreground">
          {simulations.length} simulation{simulations.length !== 1 ? 's' : ''} found
        </p>
      </div>

      <ScrollArea className="h-[520px]">
        <div className="space-y-2 pr-2">
          {simulations.map((simulation, index) => {
            const statusConfig = getStatusConfig(simulation.status)
            const scenarioConfig = getScenarioTypeConfig(simulation.scenario_type)
            const ScenarioIcon = scenarioConfig.icon

            return (
              <Card key={simulation.simulation_id} className="hover:shadow-md transition-shadow duration-200 shadow-md">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Header with name and status */}
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm leading-tight truncate">{simulation.name}</h4>
                      </div>
                      <Badge 
                        variant={statusConfig.variant}
                        className={`${statusConfig.className} text-xs font-medium px-2 py-1 pointer-events-none`}
                      >
                        {simulation.status.charAt(0).toUpperCase() + simulation.status.slice(1)}
                      </Badge>
                    </div>

                    {/* Scenario info and date */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <ScenarioIcon className={`h-3 w-3 ${scenarioConfig.color}`} />
                        <span className="capitalize">{simulation.scenario_type.replace('_', ' ')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(simulation.created_at)}</span>
                      </div>
                    </div>

                    {/* Action button */}
                    <div className="flex justify-center pt-1">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onRunSimulation(simulation.simulation_id)}
                        className="text-xs h-8 w-full shadow-md hover:shadow-lg transition-all duration-200 bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900"
                      >
                        <Play className="mr-1 h-3 w-3" />
                        View Results
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
