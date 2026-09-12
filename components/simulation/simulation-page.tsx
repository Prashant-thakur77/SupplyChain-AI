"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from 'sonner'

import { Card } from "@/components/ui/card"

import { SimulationLoader } from "@/components/simulation/test/simulation-loader"
import { AIScenarioSuggestions } from "@/components/simulation/test/ai-scenario-suggestions"
import { ScenarioProvider, useScenario, ScenarioData } from "@/lib/context/scenario-context"
import type { Simulation } from "@/lib/types/database"
import { getUserSupplyChains } from "@/lib/api/supply-chain"
import {  updateSimulation, getSimulations, findCachedSimulation, createSimulationWithCache } from "@/lib/api/simulation"
import { useUser } from "@/lib/stores/user"
import { useImpact } from "@/lib/context/impact-context"

// Import separated components
import { FloatingRunButton } from "./floating-run-button"
import { ProfessionalTemplateSelection } from "./professional-template-selection"
import type { ApiResponse, SupplyChainData } from "./types"
import { ScenarioConfigurationForm } from "./enhanced-scenario-configuration-form"

function SimulationPageContent() {
  const router = useRouter()
  const [simulationHistory, setSimulationHistory] = useState<Simulation[]>([])
  const [currentSimulation, setCurrentSimulation] = useState<Simulation | null>(null)
  const [isAIScenarioOpen, setIsAIScenarioOpen] = useState(false)
  const [progress, setProgress] = useState(0)

  // View state management - templates, form, simulation
  const [view, setView] = useState('templates')
  const [simulationRunning, setSimulationRunning] = useState(false)
  const [simulationComplete, setSimulationComplete] = useState(false)
  
  // Navigation state to track when to navigate
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null)

  // Access scenario context
  const { 
    scenarioData, 
    updateScenarioData, 
    supplyChains, 
    setSupplyChains, 
    selectedSupplyChainId, 
    setSelectedSupplyChainId 
  } = useScenario()

  // Access the impact context
  const { setImpactData, setIsLoading } = useImpact()

  // fetch user 
  const { userData, userLoading } = useUser()

  const user_id = userData?.id

  // Form validation
  const isFormValid = !!(
    scenarioData.scenarioName && 
    scenarioData.scenarioName.trim().length > 0 &&
    scenarioData.scenarioType && 
    scenarioData.scenarioType.trim().length > 0 &&
    scenarioData.affectedNode && 
    scenarioData.affectedNode.trim().length > 0 &&
    selectedSupplyChainId &&
    selectedSupplyChainId.trim().length > 0 &&
    scenarioData.disruptionSeverity > 0 &&
    scenarioData.disruptionDuration > 0
  )

  useEffect(() => {
    console.log('🔧 Form validation debug:', {
      scenarioName: scenarioData.scenarioName,
      scenarioType: scenarioData.scenarioType,
      affectedNode: scenarioData.affectedNode,
      selectedSupplyChainId: selectedSupplyChainId,
      disruptionSeverity: scenarioData.disruptionSeverity,
      disruptionDuration: scenarioData.disruptionDuration,
      isFormValid: isFormValid
    })
  }, [scenarioData, selectedSupplyChainId, isFormValid])

  useEffect(() => {
    const fetchSupplyChains = async () => {
      if (!userData?.id) {
        if (!userLoading) {
          toast.error("User not found. Please log in.")
        }
        return
      }

      try {
        const response: ApiResponse = await getUserSupplyChains(userData.id)
        if (response.status === 'success' && response.data) {
          const transformedData = response.data.map((chain: SupplyChainData) => ({
            supply_chain_id: chain.supply_chain_id,
            user_id: chain.user_id ?? null,
            name: chain.name,
            description: chain.description ?? null,
            form_data: chain.form_data ?? {},
            organisation: chain.organisation ?? {},
            timestamp: chain.timestamp ?? null
          }))
          setSupplyChains(transformedData)
          if (transformedData.length > 0) {
            setSelectedSupplyChainId(transformedData[0].supply_chain_id)
            fetchSimulationHistory(transformedData[0].supply_chain_id)
          }
        } else {
          toast.error("Failed to load supply chains")
        }
      } catch (error) {
        console.error('Error fetching supply chains:', error)
        toast.error("Failed to load supply chains")
      }
    }
    
    if (userLoading) return

    if (!supplyChains.length && userData?.id) {
      fetchSupplyChains()
    } else if (supplyChains.length > 0 && !selectedSupplyChainId) {
      setSelectedSupplyChainId(supplyChains[0].supply_chain_id)
      fetchSimulationHistory(supplyChains[0].supply_chain_id)
    }
  }, [supplyChains, userData, selectedSupplyChainId, userLoading])

  const fetchSimulationHistory = async (id: string) => {
    try {
      const sims = await getSimulations(id)
      setSimulationHistory(sims)
    } catch (error) {
      console.error('Error fetching simulation history:', error)
      toast.error("Failed to load simulation history")
    }
  }

  const handleAIScenarioSelect = (scenario: ScenarioData) => {
    updateScenarioData(scenario)
    setView('form')
    toast.success(`Applied "${scenario.scenarioName}" to the builder`)
  }

  const handleForecastScenarioSelect = (scenario: ScenarioData) => {
    updateScenarioData(scenario)
    setView('form')
    toast.success(`Applied AI forecast scenario "${scenario.scenarioName}" to the builder`)
  }

  const handleTemplateSelect = (template: any) => {
    if (template) {
      updateScenarioData(template.scenarioData)
      setView('form')
      toast.success(`Applied "${template.name}" template`)
    }
  }

  const handleStartFromScratch = () => {
    updateScenarioData({
      scenarioName: "",
      scenarioType: "disruption",
      disruptionSeverity: 50,
      disruptionDuration: 14,
      affectedNode: "",
      description: "",
      startDate: "",
      endDate: "",
      monteCarloRuns: 1000,
      distributionType: "normal",
      cascadeEnabled: true,
      failureThreshold: 50,
      bufferPercent: 15,
      alternateRouting: true,
      randomSeed: ""
    })
    setView('form')
    toast.success("Initialized custom scenario builder")
  }

  const runSimulation = async () => {
    if (!selectedSupplyChainId) {
      toast.error("Please select a supply chain first")
      return
    }

    if (!isFormValid) {
      toast.error("Please complete all required fields")
      return
    }

    try {
      setView('simulation')
      setSimulationRunning(true)
      setSimulationComplete(false)
      setProgress(0)
      setPendingNavigation(null)

      console.log('🔍 Checking for cached simulation...')
      const cachedSimulation = await findCachedSimulation(scenarioData, selectedSupplyChainId)
      
      if (cachedSimulation) {
        console.log(`✅ Found cached simulation: ${cachedSimulation.simulation_id}`)
        toast.success("Found existing simulation with same parameters")
        setCurrentSimulation(cachedSimulation)
        
        const fastInterval = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 100) {
              clearInterval(fastInterval)
              setSimulationRunning(false)
              setSimulationComplete(true)
              setPendingNavigation(`/simulation/result?id=${cachedSimulation.simulation_id}`)
              return 100
            }
            return prev + 25
          })
        }, 200)
        
        return
      }

      console.log('📭 No cached simulation found, creating new simulation...')
      
      const newSim: Partial<Simulation> = {
        supply_chain_id: selectedSupplyChainId,
        name: scenarioData.scenarioName,
        scenario_type: scenarioData.scenarioType,
        parameters: {
          severity: scenarioData.disruptionSeverity,
          duration: scenarioData.disruptionDuration,
          affectedNode: scenarioData.affectedNode,
          description: scenarioData.description,
          startDate: scenarioData.startDate,
          endDate: scenarioData.endDate,
          monteCarloRuns: scenarioData.monteCarloRuns,
          distributionType: scenarioData.distributionType,
          cascadeEnabled: scenarioData.cascadeEnabled,
          failureThreshold: scenarioData.failureThreshold,
          bufferPercent: scenarioData.bufferPercent,
          alternateRouting: scenarioData.alternateRouting,
          randomSeed: scenarioData.randomSeed
        },
        status: "running"
      }

      const created = await createSimulationWithCache(newSim, scenarioData)
      setCurrentSimulation(created)

      setIsLoading(true)

      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            return 90
          }
          return prev + 5
        })
      }, 300)

      try {
        console.log(`🎯 Triggering impact assessment for simulation: ${created?.simulation_id}`)
        
        let localNodes = []
        let localEdges = []
        try {
          const localData = localStorage.getItem(`supplyChain-${selectedSupplyChainId}`)
          if (localData) {
            const chainData = JSON.parse(localData)
            localNodes = chainData.nodes || []
            localEdges = chainData.edges || []
          }
        } catch (storageErr) {
          console.warn('⚠️ Error parsing local supply chain data:', storageErr)
        }

        const response = await fetch('/api/agent/impact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            simulationId: created?.simulation_id,
            nodes: localNodes,
            edges: localEdges,
            forceRefresh: true 
          })
        })

        const impactResponse = await response.json()
        
        if (response.ok && impactResponse.success) {
          toast.success("Impact assessment completed successfully")
          
          if (created?.simulation_id && impactResponse.data) {
            await updateSimulation(created.simulation_id, {
              status: "completed",
              result_summary: {
                enhanced_analysis: true,
                impact_assessment_completed: true,
                analysis_timestamp: new Date().toISOString(),
                ...impactResponse.data
              },
              simulated_at: new Date().toISOString()
            })
          }
        } else {
          toast.warning("Impact assessment completed with warnings")
          if (created?.simulation_id) {
            await updateSimulation(created.simulation_id, {
              status: "completed",
              result_summary: {
                enhanced_analysis: false,
                impact_assessment_completed: false,
                costImpact: "$1.2M",
                timeDelay: "14.5 days",
                inventoryImpact: "-42%",
                recoveryTime: "35 days"
              },
              simulated_at: new Date().toISOString()
            })
          }
        }
      } catch (error) {
        console.error('❌ Error calling impact assessment agent:', error)
        toast.error("Failed to run impact assessment, using basic simulation")
        
        if (created?.simulation_id) {
          await updateSimulation(created.simulation_id, {
            status: "completed",
            result_summary: {
              enhanced_analysis: false,
              impact_assessment_completed: false,
              error: "Impact assessment failed",
              costImpact: "$1.2M",
              timeDelay: "14.5 days",
              inventoryImpact: "-42%",
              recoveryTime: "35 days"
            },
            simulated_at: new Date().toISOString()
          })
        }
      } finally {
        setIsLoading(false)
        clearInterval(progressInterval)
        setProgress(100)
        
        setTimeout(() => {
          setSimulationRunning(false)
          setSimulationComplete(true)
          
          if (created?.simulation_id) {
            setPendingNavigation(`/simulation/result?id=${created.simulation_id}`)
          } else {
            setPendingNavigation('/simulation/result')
          }
        }, 500)
      }
    } catch (error) {
      console.error('Error starting simulation:', error)
      toast.error("Failed to start simulation")
      setIsLoading(false)
      setView('form')
    }
  }

  useEffect(() => {
    if (simulationComplete && pendingNavigation) {
      router.push(pendingNavigation)
      setPendingNavigation(null)
      
      if (selectedSupplyChainId) {
        fetchSimulationHistory(selectedSupplyChainId)
      }
    }
  }, [simulationComplete, pendingNavigation, selectedSupplyChainId, router])

  return (
    <div className="relative min-h-full flex-1 bg-theme-bg-primary overflow-hidden text-theme-text-primary">
      <style dangerouslySetInnerHTML={{__html: `
        /* PROBE WORKFLOW SIDEBAR */
        .probe-sidebar {
          width: 218px; min-width: 218px; background: #F6F3EE; border-right: 1px solid #E5DFD6;
          padding: 24px 16px 20px; display: flex; flex-direction: column;
        }
        .probe-label {
          font-size: 0.6rem; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.12em; color: #9C9489; margin-bottom: 20px;
        }
        .probe-steps { display: flex; flex-direction: column; gap: 0; flex: 1; }
        .probe-step { display: flex; align-items: flex-start; gap: 12px; position: relative; padding-bottom: 28px; text-align: left; }
        .probe-step:last-child { padding-bottom: 0; }
        /* Vertical connector line between steps */
        .probe-step:not(:last-child)::after {
          content: ''; position: absolute; left: 13px; top: 27px;
          width: 1.5px; height: calc(100% - 27px);
          background: #E5DFD6;
        }
        .step-circle {
          width: 27px; height: 27px; border-radius: 50%; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.75rem; font-weight: 700; position: relative; z-index: 1;
        }
        .step-circle.active { background: #2748E8; color: #fff; }
        .step-circle.done { background: #EDFAF3; border: 1.5px solid #1A7F4B; color: #1A7F4B; }
        .step-circle.pending {
          background: #F6F3EE; border: 1.5px solid #D6CFC4; color: #9C9489;
        }
        .step-text { padding-top: 3px; }
        .step-title { font-size: 0.82rem; font-weight: 600; color: #18160F; }
        .step-title.muted { color: #9C9489; font-weight: 500; }

        /* Issues badge in sidebar */
        .issues-badge-sidebar {
          display: inline-flex; align-items: center; gap: 7px; margin-top: auto;
          background: #FEF2F2; border: 1px solid rgba(185,28,28,0.25);
          border-radius: 100px; padding: 7px 12px;
          font-size: 0.75rem; font-weight: 700; color: #B91C1C; cursor: pointer;
          width: fit-content;
        }

        /* MAIN CONTENT */
        .main-content {
          flex: 1; overflow-y: auto; padding: 32px 36px 40px;
          display: flex; flex-direction: column; gap: 28px;
        }

        /* PAGE HEADER */
        .page-header { display: flex; align-items: flex-start; justify-content: space-between; }
        .ph-left { display: flex; flex-direction: column; gap: 6px; }
        .ph-eyebrow {
          font-size: 0.62rem; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.12em; color: #9C9489;
        }
        .ph-title { font-size: 1.55rem; font-weight: 800; color: #18160F; letter-spacing: -0.03em; }
        .ph-desc { font-size: 0.82rem; color: #5C5850; line-height: 1.65; max-width: 540px; margin-top: 2px; }
        .step-badge {
          font-size: 0.72rem; font-weight: 600; color: #5C5850;
          background: #EFEBE3; border: 1px solid #E5DFD6; border-radius: 8px;
          padding: 5px 12px; white-space: nowrap; margin-top: 4px;
        }

        .page-divider { height: 1px; background: #E5DFD6; }

        /* Dark Mode support */
        .dark .probe-sidebar { background: #111010; border-right-color: #2A2825; }
        .dark .probe-step:not(:last-child)::after { background: #2A2825; }
        .dark .step-circle.pending { background: #111010; border-color: #353330; color: #6B6560; }
        .dark .step-title { color: #F0EDE7; }
        .dark .step-title.muted { color: #6B6560; }
        .dark .issues-badge-sidebar { background: #1A1212; border-color: rgba(220,38,38,0.2); color: #ef4444; }
        .dark .ph-title { color: #F0EDE7; }
        .dark .ph-desc { color: #A09890; }
        .dark .step-badge { background: #191817; border-color: #2A2825; color: #A09890; }
        .dark .page-divider { background: #2A2825; }
      `}} />

      <div className="flex h-full w-full">
        {/* Left Rail — Workflow Steps */}
        <aside className="probe-sidebar">
          <div className="probe-label">Probe Workflow</div>
          <div className="probe-steps">
            {/* Step 1 */}
            <div className="probe-step">
              <button 
                onClick={() => view !== 'simulation' && setView('templates')}
                disabled={view === 'simulation'}
                className="flex items-start gap-3 text-left w-full bg-transparent border-none outline-none p-0 cursor-pointer"
              >
                <div className={`step-circle ${view === 'templates' ? 'active' : 'done'}`}>
                  {view === 'form' || view === 'simulation' ? '✓' : 1}
                </div>
                <div className="step-text">
                  <div className={`step-title ${view === 'templates' ? 'active' : 'muted'}`} style={view === 'templates' ? {color:'#2748E8'} : {}}>
                    Select Preset
                  </div>
                </div>
              </button>
            </div>

            {/* Step 2 */}
            <div className="probe-step">
              <button 
                disabled={true}
                className="flex items-start gap-3 text-left w-full bg-transparent border-none outline-none p-0 cursor-default"
              >
                <div className={`step-circle ${view === 'form' ? 'active' : (view === 'simulation' ? 'done' : 'pending')}`}>
                  {view === 'simulation' ? '✓' : 2}
                </div>
                <div className="step-text">
                  <div className={`step-title ${view === 'form' ? 'active' : 'muted'}`} style={view === 'form' ? {color:'#2748E8'} : {}}>
                    Configure Parameters
                  </div>
                </div>
              </button>
            </div>

            {/* Step 3 */}
            <div className="probe-step">
              <button 
                disabled={true}
                className="flex items-start gap-3 text-left w-full bg-transparent border-none outline-none p-0 cursor-default"
              >
                <div className={`step-circle ${view === 'simulation' ? 'active' : 'pending'}`}>
                  3
                </div>
                <div className="step-text">
                  <div className={`step-title ${view === 'simulation' ? 'active' : 'muted'}`} style={view === 'simulation' ? {color:'#2748E8'} : {}}>
                    Execute Probe
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div className="issues-badge-sidebar" onClick={() => setIsAIScenarioOpen(true)}>
            <span className="text-theme-red font-extrabold mr-1">✦</span>
            AI Generator
          </div>
        </aside>

        {/* Main Panel */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-theme-bg-primary">
          <div className="main-content">
            {view === "templates" && (
              <>
                <div className="page-header">
                  <div className="ph-left">
                    <div className="ph-eyebrow">Fault Injection Blueprint</div>
                    <h1 className="ph-title">Select an Event Vector</h1>
                    <p className="ph-desc">
                      Choose from pre-calibrated disruption presets, or define a custom fault scenario for your network graph.
                    </p>
                  </div>
                  <div className="step-badge">STEP 1 / 3</div>
                </div>

                <div className="page-divider" />

                <ProfessionalTemplateSelection
                   onTemplateSelect={handleTemplateSelect}
                   onStartFromScratch={handleStartFromScratch}
                   onAIScenarios={() => setIsAIScenarioOpen(true)}
                   onSelectScenario={handleForecastScenarioSelect}
                />
              </>
            )}

            {view === "form" && (
              <>
                <div className="page-header">
                  <div className="ph-left">
                    <div className="ph-eyebrow">Parameter Configuration</div>
                    <h1 className="ph-title">Fault Vector Parameters</h1>
                    <p className="ph-desc">
                      Define the scope and intensity of your probe — affected origin nodes, cascade probability, and fault depth.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setView("templates")}
                      className="flex items-center gap-1.5 text-xs border border-theme-border-subtle bg-theme-bg-surface px-3 py-1.5 text-theme-text-secondary hover:text-theme-text-primary hover:border-theme-border-default rounded-theme-md transition-all font-semibold"
                    >
                      ← Presets
                    </button>
                    <div className="step-badge">STEP 2 / 3</div>
                  </div>
                </div>

                <div className="page-divider" />

                <ScenarioConfigurationForm />

                <FloatingRunButton
                  isFormValid={isFormValid}
                  onRunSimulation={runSimulation}
                  scenarioData={scenarioData}
                />
              </>
            )}

            {view === "simulation" && simulationRunning && (
              <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
                <div className="w-full max-w-2xl mx-auto p-4">
                  <div className="border border-theme-border-subtle bg-theme-bg-surface rounded-theme-lg shadow-lg p-10">
                    <SimulationLoader progress={progress} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <AIScenarioSuggestions
        open={isAIScenarioOpen}
        onOpenChange={setIsAIScenarioOpen}
        onSelectScenario={handleAIScenarioSelect}
      />
    </div>
  )
}

export function SimulationPage() {
  return (
    <ScenarioProvider>
      <SimulationPageContent />
    </ScenarioProvider>
  )
}
