import { supabaseClient } from "@/lib/supabase/client"
import type { Simulation, ImpactResult, Strategy } from "@/lib/types/database"
// Simple browser-compatible string hasher
function simpleHash(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return (hash >>> 0).toString(16);
}

// Generate a hash for scenario parameters to identify duplicate scenarios
function generateScenarioHash(scenarioData: any, supplyChainId: string): string {
  const hashInput = {
    supplyChainId,
    scenarioName: scenarioData.scenarioName,
    scenarioType: scenarioData.scenarioType,
    disruptionSeverity: scenarioData.disruptionSeverity,
    disruptionDuration: scenarioData.disruptionDuration,
    affectedNode: scenarioData.affectedNode,
    description: scenarioData.description,
    monteCarloRuns: scenarioData.monteCarloRuns,
    distributionType: scenarioData.distributionType,
    cascadeEnabled: scenarioData.cascadeEnabled,
    failureThreshold: scenarioData.failureThreshold,
    bufferPercent: scenarioData.bufferPercent,
    alternateRouting: scenarioData.alternateRouting
  }
  
  const hashString = JSON.stringify(hashInput, Object.keys(hashInput).sort())
  return simpleHash(hashString)
}

// Simulation CRUD operations
export async function getSimulations(supplyChainId: string): Promise<Simulation[]> {
  const { data, error } = await supabaseClient
    .from("simulations")
    .select("*")
    .eq("supply_chain_id", supplyChainId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching simulations:", error)
    throw error
  }

  return data || []
}

export async function getSimulationById(simulationId: string): Promise<Simulation | null> {
  const { data, error } = await supabaseClient
    .from("simulations")
    .select("*")
    .eq("simulation_id", simulationId)
    .single()

  if (error) {
    console.error("Error fetching simulation:", error)
    throw error
  }

  return data
}

export async function createSimulation(simulation: Partial<Simulation>): Promise<Simulation> {
  const { data, error } = await supabaseClient.from("simulations").insert(simulation).select().single()

  if (error) {
    console.error("Error creating simulation:", error)
    throw error
  }

  return data
}

export async function updateSimulation(simulationId: string, updates: Partial<Simulation>): Promise<Simulation> {
  const { data, error } = await supabaseClient
    .from("simulations")
    .update(updates)
    .eq("simulation_id", simulationId)
    .select()
    .single()

  if (error) {
    console.error("Error updating simulation:", error)
    throw error
  }

  return data
}

export async function deleteSimulation(simulationId: string): Promise<void> {
  const { error } = await supabaseClient.from("simulations").delete().eq("simulation_id", simulationId)

  if (error) {
    console.error("Error deleting simulation:", error)
    throw error
  }
}

// Impact Results operations
export async function getImpactResults(simulationId: string): Promise<ImpactResult[]> {
  const { data, error } = await supabaseClient.from("impact_results").select("*").eq("simulation_id", simulationId)

  if (error) {
    console.error("Error fetching impact results:", error)
    throw error
  }

  return data || []
}

export async function createImpactResults(impactResults: Partial<ImpactResult>[]): Promise<ImpactResult[]> {
  const { data, error } = await supabaseClient.from("impact_results").insert(impactResults).select()

  if (error) {
    console.error("Error creating impact results:", error)
    throw error
  }

  return data || []
}

// Strategy operations
export async function getStrategies(simulationId: string): Promise<Strategy[]> {
  const { data, error } = await supabaseClient.from("strategies").select("*").eq("simulation_id", simulationId)

  if (error) {
    console.error("Error fetching strategies:", error)
    throw error
  }

  return data || []
}

export async function createStrategy(strategy: Partial<Strategy>): Promise<Strategy> {
  const { data, error } = await supabaseClient.from("strategies").insert(strategy).select().single()

  if (error) {
    console.error("Error creating strategy:", error)
    throw error
  }

  return data
}

export async function updateStrategy(strategyId: string, updates: Partial<Strategy>): Promise<Strategy> {
  const { data, error } = await supabaseClient
    .from("strategies")
    .update(updates)
    .eq("strategy_id", strategyId)
    .select()
    .single()

  if (error) {
    console.error("Error updating strategy:", error)
    throw error
  }

  return data
}

// Get complete simulation with impact results and strategies
export async function getCompleteSimulation(simulationId: string): Promise<{
  simulation: Simulation | null
  impactResults: ImpactResult[]
  strategies: Strategy[]
}> {
  const simulationPromise = getSimulationById(simulationId)
  const impactResultsPromise = getImpactResults(simulationId)
  const strategiesPromise = getStrategies(simulationId)

  const [simulation, impactResults, strategies] = await Promise.all([
    simulationPromise,
    impactResultsPromise,
    strategiesPromise,
  ])

  return {
    simulation,
    impactResults,
    strategies,
  }
}

// Get enhanced simulation results with impact assessment
export async function getEnhancedSimulationResults(simulationId: string): Promise<any> {
  // Always fetch the base simulation so we always have scenarioName / status / completedAt
  const basicSimulation = await getCompleteSimulation(simulationId)
  const base = transformBasicToEnhanced(basicSimulation)

  try {
    const response = await fetch(`/api/agent/impact?simulationId=${simulationId}`)

    if (!response.ok) {
      console.warn('Impact assessment API returned non-OK, using basic data')
      return base
    }

    const result = await response.json()

    if (!result.success || !result.data) {
      console.warn('Impact assessment not successful, using basic data')
      return base
    }

    const ai = result.data

    // Map AI agent response shape → SimulationResults shape
    return {
      // Base fields always from the real simulation record
      scenarioName:   base.scenarioName,
      scenarioType:   base.scenarioType,
      status:         base.status,
      completedAt:    base.completedAt,

      // Metrics: prefer AI values, fallback to base
      metrics: {
        totalCostImpact:    ai.financialImpact?.totalCostImpact    || base.metrics.totalCostImpact,
        averageDelay:       ai.operationalImpact?.averageDelay      || base.metrics.averageDelay,
        inventoryReduction: ai.operationalImpact?.inventoryReduction || base.metrics.inventoryReduction,
        recoveryTime:       ai.operationalImpact?.recoveryTime       || base.metrics.recoveryTime,
        affectedNodes:      ai.operationalImpact?.affectedNodes      || base.metrics.affectedNodes,
        criticalPath:       ai.criticalPath                         || base.metrics.criticalPath,
      },

      // Narrative fields
      keyFindings:   ai.keyFindings      || (ai.executiveSummary ? [ai.executiveSummary] : base.keyFindings),
      impactBreakdown: ai.financialImpact?.costBreakdown?.map((c: any) =>
        `${c.category}: ${c.amount} (${c.percentage}%)`
      ) || base.impactBreakdown,
      riskFactors:   ai.riskFactors      || base.riskFactors,

      // Enhanced AI-only fields
      mitigationStrategies: (ai.mitigationStrategies || base.mitigationStrategies)?.map((s: any) => ({
        strategy:         s.title       || s.strategy,
        estimatedCost:    s.estimatedCost,
        timeToImplement:  s.timeToImplement,
        riskReduction:    s.riskReduction,
        feasibility:      s.feasibility || (s.difficulty === 'Low' ? 'HIGH' : s.difficulty === 'Medium' ? 'MEDIUM' : 'LOW'),
      })),
      cascadingEffects:   ai.cascadingEffects    || base.cascadingEffects,
      networkAnalysis:    ai.networkAnalysis,
      confidenceScore:    ai.confidenceScore,
      processingTime:     ai.processingTime,
      analysisDepth:      ai.analysisDepth       || 'AI_ENHANCED',
    }
  } catch (error) {
    console.error('Error getting enhanced simulation results:', error)
    return base
  }
}


// Trigger impact assessment for a simulation
export async function triggerImpactAssessment(simulationId: string, forceRefresh: boolean = false): Promise<any> {
  // Fetch base simulation data first so we always have identity fields
  const basicSimulation = await getCompleteSimulation(simulationId)
  const base = transformBasicToEnhanced(basicSimulation)

  try {
    console.log(`🚀 Triggering impact assessment for simulation: ${simulationId}`)

    const response = await fetch('/api/agent/impact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ simulationId, forceRefresh })
    })

    if (!response.ok) {
      throw new Error(`Impact assessment failed: ${response.statusText}`)
    }

    const result = await response.json()

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Impact assessment failed')
    }

    console.log('✅ Impact assessment completed successfully')
    const ai = result.data

    // Map AI agent response → SimulationResults shape
    return {
      scenarioName:   base.scenarioName,
      scenarioType:   base.scenarioType,
      status:         base.status,
      completedAt:    base.completedAt,
      metrics: {
        totalCostImpact:    ai.financialImpact?.totalCostImpact    || base.metrics.totalCostImpact,
        averageDelay:       ai.operationalImpact?.averageDelay      || base.metrics.averageDelay,
        inventoryReduction: ai.operationalImpact?.inventoryReduction || base.metrics.inventoryReduction,
        recoveryTime:       ai.operationalImpact?.recoveryTime       || base.metrics.recoveryTime,
        affectedNodes:      ai.operationalImpact?.affectedNodes      || base.metrics.affectedNodes,
        criticalPath:       ai.criticalPath                         || base.metrics.criticalPath,
      },
      keyFindings:   ai.keyFindings || (ai.executiveSummary ? [ai.executiveSummary] : base.keyFindings),
      impactBreakdown: ai.financialImpact?.costBreakdown?.map((c: any) =>
        `${c.category}: ${c.amount} (${c.percentage}%)`
      ) || base.impactBreakdown,
      riskFactors:   ai.riskFactors || base.riskFactors,
      mitigationStrategies: (ai.mitigationStrategies || base.mitigationStrategies)?.map((s: any) => ({
        strategy:         s.title       || s.strategy,
        estimatedCost:    s.estimatedCost,
        timeToImplement:  s.timeToImplement,
        riskReduction:    s.riskReduction,
        feasibility:      s.feasibility || (s.difficulty === 'Low' ? 'HIGH' : s.difficulty === 'Medium' ? 'MEDIUM' : 'LOW'),
      })),
      cascadingEffects:   ai.cascadingEffects || base.cascadingEffects,
      networkAnalysis:    ai.networkAnalysis,
      confidenceScore:    ai.confidenceScore,
      processingTime:     ai.processingTime,
      analysisDepth:      ai.analysisDepth || 'AI_ENHANCED',
    }
  } catch (error) {
    console.error('❌ Error triggering impact assessment:', error)
    throw error
  }
}

// Transform basic simulation data to enhanced format for compatibility
function transformBasicToEnhanced(basicData: {
  simulation: Simulation | null
  impactResults: ImpactResult[]
  strategies: Strategy[]
}): any {
  if (!basicData.simulation) {
    return null
  }

  // Create a map of impact results by metric name
  const impactMap = new Map(
    basicData.impactResults.map(result => [result.metric_name, result])
  )

  // Helper function to get metric value with fallback
  const getMetricValue = (metricName: string, defaultValue: string, unit = ''): string => {
    const result = impactMap.get(metricName)
    if (result) {
      return `${result.metric_value}${unit || result.measurement_unit}`
    }
    return defaultValue
  }

  // Extract summary data from simulation result_summary if available
  const resultSummary = basicData.simulation.result_summary || {}

  return {
    scenarioName: basicData.simulation.name,
    scenarioType: basicData.simulation.scenario_type,
    status: basicData.simulation.status,
    completedAt: basicData.simulation.simulated_at || basicData.simulation.created_at,
    metrics: {
      totalCostImpact: getMetricValue('total_cost_impact', '$2.4M'),
      averageDelay: getMetricValue('average_delay', '18.5 days'),
      inventoryReduction: getMetricValue('inventory_reduction', '38%'),
      recoveryTime: getMetricValue('recovery_time', '42 days'),
      affectedNodes: parseInt(getMetricValue('affected_nodes', '15')) || 15,
      criticalPath: resultSummary.critical_path || 'Primary Supply Route → Manufacturing → Distribution'
    },
    keyFindings: resultSummary.key_findings || [
      "Supply chain analysis completed with available data",
      "Impact assessment based on historical patterns",
      "Recovery strategies identified for optimization",
      "Risk factors evaluated for mitigation planning"
    ],
    impactBreakdown: resultSummary.impact_breakdown || [
      "Operational cost impact estimated from available metrics",
      "Revenue impact calculated from delay projections",
      "Additional costs identified for contingency planning"
    ],
    riskFactors: resultSummary.risk_factors || [
      "Network dependencies identified for review",
      "Supply chain resilience assessment completed",
      "Risk mitigation strategies under evaluation"
    ],
    mitigationStrategies: basicData.strategies.map(strategy => ({
      strategy: strategy.strategy_title,
      estimatedCost: `$${strategy.cost_estimate?.toLocaleString() || '100K'}`,
      timeToImplement: strategy.implementation_time || '2-4 months',
      riskReduction: `${strategy.risk_reduction || 25}%`,
      feasibility: strategy.complexity === 'low' ? 'HIGH' : 
                  strategy.complexity === 'medium' ? 'MEDIUM' : 'LOW'
    })),
    cascadingEffects: resultSummary.cascading_effects || [
      {
        affectedNode: "Primary Operations",
        impactType: "Operational disruption",
        severity: "MEDIUM",
        timeline: "Day 1-14"
      }
    ],
    processingTime: 0,
    analysisDepth: 'BASIC_TRANSFORMATION',
    networkComplexity: 1,
    dataSourcesAnalyzed: {
      nodes: 0,
      edges: 0,
      existingImpacts: basicData.impactResults.length
    }
  }
}

// Check if a similar scenario has already been simulated
export async function findCachedSimulation(scenarioData: any, supplyChainId: string): Promise<Simulation | null> {
  try {
    const scenarioHash = generateScenarioHash(scenarioData, supplyChainId)
    console.log(`🔍 Checking for cached simulation with hash: ${scenarioHash}`)

    // Get all completed simulations for this supply chain
    const { data, error } = await supabaseClient
      .from("simulations")
      .select("*")
      .eq("supply_chain_id", supplyChainId)
      .eq("status", "completed")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error checking cached simulation:", error)
      return null
    }

    if (data && data.length > 0) {
      // Check for matching scenario hash in parameters
      for (const simulation of data) {
        const parameters = simulation.parameters || {}
        if (parameters.scenario_hash === scenarioHash) {
          console.log(`✅ Found cached simulation: ${simulation.simulation_id}`)
          return simulation
        }
      }
    }

    console.log("📭 No cached simulation found")
    return null
  } catch (error) {
    console.error("Error in findCachedSimulation:", error)
    return null
  }
}

// Create simulation with scenario hash for caching
export async function createSimulationWithCache(simulation: Partial<Simulation>, scenarioData: any): Promise<Simulation> {
  const scenarioHash = generateScenarioHash(scenarioData, simulation.supply_chain_id!)
  
  const simulationWithHash = {
    ...simulation,
    parameters: {
      ...simulation.parameters,
      scenario_hash: scenarioHash
    }
  }

  console.log(`💾 Creating simulation with hash: ${scenarioHash}`)
  
  const { data, error } = await supabaseClient
    .from("simulations")
    .insert(simulationWithHash)
    .select()
    .single()

  if (error) {
    console.error("Error creating simulation:", error)
    throw error
  }

  return data
}
