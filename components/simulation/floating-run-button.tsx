"use client"

import { PlayIcon } from "@/components/icons/play-button"
import { Button } from "@/components/ui/button"

interface FloatingRunButtonProps {
  isFormValid: boolean
  onRunSimulation: () => void
  scenarioData?: any // Add scenario data for better validation feedback
}

export function FloatingRunButton({ isFormValid, onRunSimulation, scenarioData }: FloatingRunButtonProps) {
  // Generate more helpful button text
  const getButtonText = () => {
    if (!scenarioData) return isFormValid ? "Run Simulation" : "Complete Form"
    
    if (!scenarioData.scenarioName?.trim()) return "Enter Scenario Name"
    if (!scenarioData.scenarioType?.trim()) return "Select Scenario Type"
    if (!scenarioData.affectedNode?.trim()) return "Select Affected Nodes"
    if (scenarioData.disruptionSeverity <= 0) return "Set Disruption Severity"
    if (scenarioData.disruptionDuration <= 0) return "Set Disruption Duration"
    
    return isFormValid ? "Run Simulation" : "Complete Form"
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button 
        onClick={onRunSimulation} 
        disabled={!isFormValid}
        size="lg"
        className="shadow-xl h-12 px-6 text-base rounded-lg bg-black text-white dark:bg-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90 transition-all duration-200 hover:scale-105"
      >
        <PlayIcon className="mr-2" size={20} />
        {getButtonText()}
      </Button>
    </div>
  )
} 