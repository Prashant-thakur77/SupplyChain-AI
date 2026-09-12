"use client"

import { Button } from "@/components/ui/button"
import { Play, Save, Sparkles } from "lucide-react"

type Props = {
  onRun: () => void
  onAIScenarioClick: () => void
  disabled?: boolean
}

export function SimulationToolbar({ onRun, onAIScenarioClick, disabled }: Props) {
  return (
    <div className="flex items-center justify-between border-b p-4">
      <h1 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">Simulation & Scenario Generation</h1>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onAIScenarioClick}>
          <Sparkles className="mr-2 h-4 w-4 text-yellow-500" /> AI Scenario
        </Button>
        <Button variant="outline" size="sm">
          <Save className="mr-2 h-4 w-4" /> Save Scenario
        </Button>
        <Button variant="default" size="sm" onClick={onRun} disabled={disabled}>
          <Play className="mr-2 h-4 w-4" /> Run Simulation
        </Button>
      </div>
    </div>
  )
}
