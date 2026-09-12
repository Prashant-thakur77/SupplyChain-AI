"use client"

import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Play } from "lucide-react"

type Props = {
  onRun: () => void
  disabled?: boolean
}

export function SimulationEmptyState({ onRun, disabled }: Props) {
  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Simulation Instructions</CardTitle>
          <CardDescription>Follow these steps to run a supply chain disruption simulation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4].map((step, index) => (
            <div key={index} className="flex items-start gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">{step}</div>
              <div className="space-y-1">
                <h4 className="text-base font-medium">
                  {["Configure Scenario", "Select Affected Nodes", "Run Simulation", "Analyze Results"][index]}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {
                    [
                      "Set up your scenario parameters in the left panel.",
                      "Choose which parts of your supply chain will be affected.",
                      "Click the Run Simulation button to start.",
                      "Review the impact assessment and strategies.",
                    ][index]
                  }
                </p>
              </div>
            </div>
          ))}
        </CardContent>
        <CardFooter>
          <Button onClick={onRun} className="w-full" disabled={disabled}>
            <Play className="mr-2 h-4 w-4" /> Start Simulation
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
