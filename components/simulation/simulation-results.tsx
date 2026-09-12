"use client"

import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { Card } from "@/components/ui/card"
import type { Simulation } from "@/lib/types/database"
import { getSimulationById } from "@/lib/api/simulation"
import ImpactAssessment from "../impact-assessment"

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

interface SimulationResultsProps {
  simulationId?: string
}

export function SimulationResults({ simulationId }: SimulationResultsProps) {
  const [simulation, setSimulation] = useState<Simulation | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchSimulation = async () => {
      if (!simulationId) return

      try {
        setLoading(true)
        const data = await getSimulationById(simulationId)
        setSimulation(data)
      } catch (error) {
        console.error("Error fetching simulation:", error)
        toast({
          title: "Error",
          description: "Failed to load simulation results",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchSimulation()
  }, [simulationId, toast])

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A"

    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  if (loading) {
    return (
      <GlassmorphicCard className="flex items-center justify-center h-64 p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <div className="ml-4 text-slate-700 dark:text-slate-300">Loading simulation results...</div>
      </GlassmorphicCard>
    )
  }

  // Extract result summary from simulation


  return (
      <ImpactAssessment />
    
  )
}
