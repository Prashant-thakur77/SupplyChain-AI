import '@/lib/zod-patch';
// Enhanced Supply Chain Impact Assessment Agent V2.0
// Production-grade AI agent for comprehensive impact analysis with advanced ML algorithms

import { NextRequest, NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { createGoogleGenerativeAI, google } from '@ai-sdk/google'
import { LlmAgent, Gemini, InMemoryRunner, stringifyContent } from "@google/adk"
import { withTrace } from '../../../../lib/adk/core/trace';
import { createHash } from 'crypto'
import { getAIKeyForModule, AI_MODELS } from '@/lib/ai-config'
import { z } from 'zod'
import { supabaseServer } from '@/lib/supabase/server'
import { agentAudit } from '@/lib/audit-logger';
import { getRedisClient } from '@/lib/clients/redis';
import type { Simulation, ImpactResult, Node, Edge, SupplyChain } from '@/lib/types/database'
import { createMem0, addMemories, retrieveMemories, getMemories } from '@mem0/vercel-ai-provider'


// Enhanced Impact Assessment Schema with Standardized Response Formats
const ImpactMetricsSchema = z.object({
  totalCostImpact: z.string()
    .describe('Total financial impact in format: "$XXXk - $XXXk" (e.g., "$500K - $750K") with confidence interval'),
  averageDelay: z.string()
    .describe('Average delay time in format: "XX-XX days" (e.g., "30-45 days") with statistical variance'),
  inventoryReduction: z.string()
    .describe('Inventory reduction in format: "XX-XX%" (e.g., "20-30%") showing impact range'),
  recoveryTime: z.string()
    .describe('Recovery time in format: "XX-XX days" (e.g., "60-90 days") for full operational recovery'),
  affectedNodes: z.number().describe('Number of nodes directly or indirectly affected'),
  criticalPath: z.string().describe('Most critical disrupted path with bottleneck analysis'),
  networkResilience: z.number().describe('Overall network resilience score (0-100)'),
  cascadingProbability: z.number().describe('Probability of cascading failure (0-1)')
})

const CascadingEffectSchema = z.object({
  affectedNode: z.string().describe('Node name affected by cascading impact'),
  impactType: z.string().describe('Type of impact (operational, financial, supply, demand)'),
  severity: z.string().describe('LOW, MEDIUM, HIGH, or CRITICAL'),
  timeline: z.string().describe('When this impact will manifest'),
  propagationPath: z.array(z.string()).describe('Path of impact propagation through network'),
  probability: z.number().describe('Probability of this cascading effect occurring (0-1)'),
  financialImpact: z.string().describe('Financial impact in format "$XXXk - $XXXk" (e.g., "$100K - $200K")'),
  mitigationComplexity: z.string().describe('Complexity of mitigating this effect (LOW, MEDIUM, HIGH)')
})

const MitigationStrategySchema = z.object({
  strategy: z.string().describe('Detailed mitigation strategy description'),
  estimatedCost: z.string().describe('Cost estimate with confidence range'),
  timeToImplement: z.string().describe('Implementation timeline with phases'),
  riskReduction: z.string().describe('Risk reduction percentage with effectiveness metrics'),
  feasibility: z.string().describe('HIGH, MEDIUM, or LOW'),
  priority: z.string().describe('IMMEDIATE, SHORT_TERM, MEDIUM_TERM, LONG_TERM'),
  dependencies: z.array(z.string()).describe('Required dependencies for implementation'),
  successProbability: z.number().describe('Probability of successful implementation (0-1)'),
  roi: z.number().describe('Return on investment as multiplier')
})

const NetworkAnalysisSchema = z.object({
  totalNodes: z.number().describe('Total nodes in the network'),
  totalEdges: z.number().describe('Total connections/edges in the network'),
  networkDensity: z.number().describe('Network density (0-1)'),
  criticalNodes: z.array(z.string()).describe('Nodes critical to network functionality'),
  singlePointsOfFailure: z.array(z.string()).describe('Nodes that would cause major disruption if failed'),
  alternativeRoutes: z.number().describe('Number of alternative routing options'),
  averageShortestPath: z.number().describe('Average shortest path length between nodes'),
  clusteringCoefficient: z.number().describe('How well connected neighbors are (0-1)')
})

const SimulationResultsSchema = z.object({
  scenarioName: z.string().describe('Name of the disruption scenario'),
  scenarioType: z.string().describe('Type of disruption (Infrastructure, Weather, Geopolitical, etc.)'),
  status: z.string().describe('running, completed, or failed'),
  completedAt: z.string().describe('ISO timestamp of completion'),
  metrics: ImpactMetricsSchema,
  keyFindings: z.array(z.string()).describe('Key analytical findings with quantified insights'),
  impactBreakdown: z.array(z.string()).describe('Detailed financial/operational impact breakdown with causation'),
  riskFactors: z.array(z.string()).describe('Identified systemic risk factors with probability assessments'),
  mitigationStrategies: z.array(MitigationStrategySchema).describe('Prioritized mitigation strategies with ROI analysis'),
  cascadingEffects: z.array(CascadingEffectSchema).describe('Comprehensive cascading effect analysis'),
  networkAnalysis: NetworkAnalysisSchema.describe('Network topology and resilience analysis'),
  confidenceScore: z.number().describe('Overall confidence in the analysis (0-1)'),
  monteCarloRuns: z.number().describe('Number of Monte Carlo simulations performed'),
  analysisDepth: z.string().describe('Depth of analysis performed (BASIC, INTERMEDIATE, ADVANCED, EXPERT)'),
  processingTime: z.number().describe('Time taken for analysis in milliseconds'),
  dataQuality: z.object({
    completeness: z.number().describe('Data completeness score (0-1)'),
    consistency: z.number().describe('Data consistency score (0-1)'),
    recency: z.number().describe('Data recency score (0-1)')
  }).describe('Quality metrics of input data')
})

// Production Impact Assessment Agent Class
class ProductionImpactAssessmentAgent {

  constructor() {
    console.log('🚀 Production Impact Assessment Agent V2.0 initialized with Mem0 integration')
  }

  // Enhanced cache management with scenario-based caching
  public async getCachedImpactAssessment(simulationId: string): Promise<any | null> {
    try {
      const cacheKey = `impact_assessment_v2:${simulationId}`
      const cached = await getRedisClient().get(cacheKey)
      
      if (cached) {
        console.log(`📋 Retrieved cached impact assessment for simulation ${simulationId}`)
        try { await getRedisClient().setex(`${cacheKey}:hit`, 300, new Date().toISOString()) } catch {}
        return cached
      }
      
      return null
    } catch (error) {
      console.warn('⚠️ Cache retrieval skipped (Redis unavailable):', (error as any)?.message)
      return null
    }
  }

  public async cacheImpactAssessment(simulationId: string, assessment: any): Promise<void> {
    try {
      const cacheKey = `impact_assessment_v2:${simulationId}`
      const ttl = 7200
      await getRedisClient().setex(cacheKey, ttl, JSON.stringify(assessment))
      try {
        await getRedisClient().setex(`${cacheKey}:meta`, ttl, JSON.stringify({
          cachedAt: new Date().toISOString(),
          simulationId,
          version: 'v2.0',
          analysisDepth: assessment.analysisDepth || 'ADVANCED'
        }))
      } catch {}
      console.log(`💾 Cached enhanced impact assessment for simulation ${simulationId} (TTL: ${ttl}s)`)
    } catch (error) {
      console.warn('⚠️ Cache storage skipped (Redis unavailable):', (error as any)?.message)
    }
  }

  /**
   * Build memory context from previous impact assessments using Mem0
   * This provides historical context for better analysis
   */
  async buildMemoryContext(supplyChainId: string, scenarioType: string, simulationId: string): Promise<string> {
    let memoryContext = ''
    
    try {
      if (!process.env.MEM0_API_KEY) {
        console.log('📝 Mem0 API key not available, skipping memory context')
        return 'Memory context not available (Mem0 API key not configured)'
      }

      // Build rich search queries for different types of impact memories
      const searchQueries = [
        `impact assessment ${scenarioType} supply chain ${supplyChainId}`,
        `financial impact analysis ${scenarioType}`,
        `supply chain disruption ${scenarioType} cost delay inventory`,
        `cascading effects ${scenarioType} network resilience`,
        `recovery time estimation ${scenarioType}`
      ]

      // Retrieve memories using multiple search strategies
      const memoryPromises = searchQueries.map(async (query) => {
        try {
          return await getMemories(query, {
            user_id: `impact-chain-${supplyChainId}`,
            mem0ApiKey: process.env.MEM0_API_KEY
          })
        } catch (error) {
          console.warn(`Memory retrieval failed for query: ${query}`, error)
          return []
        }
      })

      const memoryResults = await Promise.allSettled(memoryPromises)
      const allMemories = memoryResults
        .filter((result): result is PromiseFulfilledResult<any[]> => result.status === 'fulfilled')
        .flatMap(result => result.value)
        .filter(Boolean)

      // Remove duplicates based on memory content
      const uniqueMemories = Array.from(
        new Map(allMemories.map(m => [m.id || m.content || m.text, m])).values()
      )

      console.log(`🧠 Retrieved ${uniqueMemories.length} unique impact assessment memories`)

      if (uniqueMemories.length === 0) {
        return 'No historical impact assessment data available for this supply chain'
      }

      // Filter memories by scenario type for more relevant context
      const relevantMemories = uniqueMemories.filter((memory: any) => {
        const memContent = (memory.content || memory.text || '').toLowerCase()
        return memContent.includes(scenarioType.toLowerCase()) || 
               memContent.includes('impact') || 
               memContent.includes('disruption')
      }).slice(0, 5)

      if (relevantMemories.length > 0) {
        memoryContext += `\nHISTORICAL IMPACT ASSESSMENTS (${scenarioType}):\n`
        relevantMemories.forEach((memory: any, index: number) => {
          const memText = memory.content || memory.text || memory.memory || ''
          memoryContext += `\n${index + 1}. ${memText.substring(0, 300)}...\n`
          
          // Extract structured metadata if available
          if (memory.metadata) {
            if (memory.metadata.cost_impact) {
              memoryContext += `   - Previous Cost Impact: ${memory.metadata.cost_impact}\n`
            }
            if (memory.metadata.affected_nodes) {
              memoryContext += `   - Previously Affected Nodes: ${memory.metadata.affected_nodes}\n`
            }
            if (memory.metadata.analysis_date) {
              memoryContext += `   - Analysis Date: ${memory.metadata.analysis_date}\n`
            }
          }
        })
      }

      // Get general supply chain memories for broader context
      const generalMemories = uniqueMemories.filter((memory: any) => {
        const memContent = (memory.content || memory.text || '').toLowerCase()
        return !memContent.includes(scenarioType.toLowerCase()) && 
               (memContent.includes('supply chain') || memContent.includes('risk'))
      }).slice(0, 3)

      if (generalMemories.length > 0) {
        memoryContext += `\nOTHER HISTORICAL ASSESSMENTS:\n`
        generalMemories.forEach((memory: any, index: number) => {
          const memText = memory.content || memory.text || memory.memory || ''
          memoryContext += `\n${index + 1}. ${memText.substring(0, 200)}...\n`
        })
      }

      // Add trend analysis if we have multiple memories
      if (uniqueMemories.length >= 2) {
        memoryContext += `\nTREND ANALYSIS:\n`
        memoryContext += `- Historical assessments available: ${uniqueMemories.length}\n`
        memoryContext += `- Most relevant scenario type: ${scenarioType}\n`
        memoryContext += `- Analysis improves with historical context\n`
      }

      return memoryContext || 'Limited historical context available'
    } catch (error) {
      console.error('❌ Error building memory context:', error)
      return 'Error retrieving historical context'
    }
  }

  /**
   * Store comprehensive impact assessment results in Mem0 for future reference
   */
  async storeImpactMemory(simulationId: string, impactData: any, supplyChainData: any): Promise<boolean> {
    if (!process.env.MEM0_API_KEY) {
      console.log('📝 Mem0 API key not available, skipping memory storage')
      return false
    }
    
    try {
      // Create rich, structured memory about the impact assessment
      const memoryText = `
SUPPLY CHAIN IMPACT ASSESSMENT ANALYSIS:

Simulation Details:
- Scenario: ${supplyChainData.simulation.name} (${supplyChainData.simulation.scenario_type})
- Supply Chain: ${supplyChainData.supplyChain?.name || 'Unknown'}
- Organization: ${supplyChainData.supplyChain?.organisation || 'Unknown'}
- Analysis Date: ${new Date().toISOString()}

IMPACT METRICS:
- Total Cost Impact: ${impactData.financialImpact?.totalCostImpact || 'Unknown'}
- Average Delay: ${impactData.operationalImpact?.averageDelay || 'Unknown'}
- Inventory Reduction: ${impactData.operationalImpact?.inventoryReduction || 'Unknown'}
- Recovery Time: ${impactData.operationalImpact?.recoveryTime || 'Unknown'}
- Affected Nodes: ${impactData.operationalImpact?.affectedNodes || 'Unknown'}
- Network Resilience Score: ${impactData.networkResilience || 'N/A'}/100
- Cascading Probability: ${Math.round((impactData.cascadingProbability || 0) * 100)}%

KEY FINDINGS:
${(impactData.keyFindings || (impactData.executiveSummary ? [impactData.executiveSummary] : [])).map((finding: string) => `- ${finding}`).join('\n')}

FINANCIAL IMPACT BREAKDOWN:
${(impactData.financialImpact?.costBreakdown || []).map((c: any) => `- ${c.category}: ${c.amount} (${c.percentage}%)`).join('\n')}

RISK FACTORS IDENTIFIED:
${(impactData.riskFactors || []).map((risk: string) => `- ${risk}`).join('\n')}

${impactData.cascadingEffects && impactData.cascadingEffects.length > 0 ? 
`CASCADING EFFECTS:
${impactData.cascadingEffects.slice(0, 5).map((effect: any) => 
  `- ${effect.affectedNode}: ${effect.impactType} (${effect.severity}) - ${effect.timeline}`
).join('\n')}` : ''}

${impactData.mitigationStrategies && impactData.mitigationStrategies.length > 0 ? 
`TOP MITIGATION STRATEGIES:
${impactData.mitigationStrategies.slice(0, 3).map((strategy: any) => 
  `- ${strategy.title || strategy.strategy} (Cost: ${strategy.estimatedCost}, Timeline: ${strategy.timeToImplement})`
).join('\n')}` : ''}

ANALYSIS METADATA:
- Processing Time: ${impactData.processingTime || 0}ms
- Analysis Depth: ${impactData.analysisDepth || 'ADVANCED'}
- Confidence Score: ${impactData.confidenceScore ? (impactData.confidenceScore * 100).toFixed(1) + '%' : 'N/A'}
- Monte Carlo Runs: ${impactData.monteCarloRuns || 'N/A'}
      `

      // Create memory messages using the correct format from info agent
      const memoryMessages = [{
        role: 'user' as const,
        content: [{
          type: 'text' as const,
          text: memoryText
        }]
      }]

      // Store memory with comprehensive metadata using the working format
      await addMemories(memoryMessages, {
        user_id: `impact-chain-${supplyChainData.simulation.supply_chain_id}`,
        mem0ApiKey: process.env.MEM0_API_KEY
      })

      console.log(`🧠 Stored comprehensive impact assessment memory for simulation ${simulationId}`)
      return true
    } catch (error: any) {
      console.error('❌ Error storing impact memory:', error)
      return false
    }
  }

  /**
   * Retrieve relevant impact assessment memories for analysis context
   */
  async getImpactMemories(simulationId: string, supplyChainId: string): Promise<any[]> {
    if (!process.env.MEM0_API_KEY) {
      console.log('📝 Mem0 API key not available, skipping memory retrieval')
      return []
    }

    try {
      // Multiple search strategies for comprehensive memory retrieval
      const searchQueries = [
        `impact assessment supply chain ${supplyChainId}`,
        `financial impact analysis ${supplyChainId}`,
        `supply chain disruption cost analysis`,
        `cascading effects network resilience`,
        `supply chain risk assessment ${supplyChainId}`
      ]

      const memoryPromises = searchQueries.map(async (query) => {
        try {
          return await getMemories(query, {
            user_id: `impact-chain-${supplyChainId}`,
            mem0ApiKey: process.env.MEM0_API_KEY
          })
        } catch (error) {
          return []
        }
      })

      const results = await Promise.allSettled(memoryPromises)
      const allMemories = results
        .filter((result): result is PromiseFulfilledResult<any[]> => result.status === 'fulfilled')
        .flatMap(result => result.value)
        .filter(Boolean)

      // Remove duplicates and sort by relevance
      const uniqueMemories = Array.from(
        new Map(allMemories.map(m => [m.id || m.content || m.text, m])).values()
      )

      console.log(`🧠 Retrieved ${uniqueMemories.length} impact assessment memories`)
      return uniqueMemories.slice(0, 10) // Limit to most relevant
    } catch (error: any) {
      console.error('❌ Error retrieving impact memories:', error)
      return []
    }
  }

  // Generate a hash for scenario parameters to enable scenario-based caching
  private generateScenarioHash(simulation: Simulation): string {
    const hashInput = {
      supplyChainId: simulation.supply_chain_id,
      scenarioType: simulation.scenario_type,
      parameters: simulation.parameters,
      name: simulation.name
    }
    
    // Create a consistent hash from scenario parameters
    const hashString = JSON.stringify(hashInput, Object.keys(hashInput).sort())
    return createHash('sha256').update(hashString).digest('hex').substring(0, 16)
  }

  // Check for similar scenario results that can be reused
  public async findSimilarScenarioResults(simulationId: string): Promise<any | null> {
    try {
      const { data: currentSimulation } = await supabaseServer
        .from('simulations')
        .select('*')
        .eq('simulation_id', simulationId)
        .single()

      if (!currentSimulation) return null

      const scenarioHash = this.generateScenarioHash(currentSimulation)
      const scenarioCacheKey = `scenario_cache_v2:${scenarioHash}`
      
      try {
        const similarResults = await getRedisClient().get(scenarioCacheKey)
        if (similarResults) {
          console.log(`🔍 Found similar scenario results for hash: ${scenarioHash}`)
          return JSON.parse(similarResults as string)
        }
      } catch {
        // Redis unavailable — skip scenario cache
      }

      return null
    } catch (error) {
      console.warn('⚠️ findSimilarScenarioResults skipped:', (error as any)?.message)
      return null
    }
  }

  // Cache scenario results for future similar scenarios
  public async cacheScenarioResults(simulationId: string, assessment: any): Promise<void> {
    try {
      const { data: simulation } = await supabaseServer
        .from('simulations')
        .select('*')
        .eq('simulation_id', simulationId)
        .single()

      if (simulation) {
        const scenarioHash = this.generateScenarioHash(simulation)
        const scenarioCacheKey = `scenario_cache_v2:${scenarioHash}`
        try {
          await getRedisClient().setex(scenarioCacheKey, 14400, JSON.stringify({
            ...assessment,
            originalSimulationId: simulationId,
            scenarioHash,
            cachedAt: new Date().toISOString()
          }))
          console.log(`🧬 Cached scenario results for future similar scenarios (hash: ${scenarioHash})`)
        } catch {
          // Redis unavailable — skip
        }
      }
    } catch (error) {
      console.warn('⚠️ cacheScenarioResults skipped:', (error as any)?.message)
    }
  }

  // Comprehensive data gathering for impact analysis
  private async gatherSupplyChainData(
    simulationId: string
  ): Promise<{
    simulation: Simulation,
    supplyChain: SupplyChain,
    nodes: Node[],
    edges: Edge[],
    existingImpacts: ImpactResult[]
  }> {
    try {
      console.log(`🔍 Gathering comprehensive supply chain data for simulation ${simulationId}`)

      // Fetch simulation details
      const { data: simulation, error: simError } = await supabaseServer
        .from('simulations')
        .select('*')
        .eq('simulation_id', simulationId)
        .single()

      if (simError) throw simError

      // Fetch supply chain details
      const { data: supplyChain, error: scError } = await supabaseServer
        .from('supply_chains')
        .select('*')
        .eq('supply_chain_id', simulation.supply_chain_id)
        .single()

      if (scError) throw scError

      // Always fetch nodes from Supabase (source of truth)
      const { data: nodes, error: nodesError } = await supabaseServer
        .from('nodes')
        .select('*')
        .eq('supply_chain_id', simulation.supply_chain_id)

      if (nodesError) throw nodesError

      // Always fetch edges from Supabase (source of truth)
      const { data: edges, error: edgesError } = await supabaseServer
        .from('edges')
        .select('*')
        .eq('supply_chain_id', simulation.supply_chain_id)

      if (edgesError) throw edgesError

      // Fetch existing impact results
      const { data: existingImpacts, error: impactsError } = await supabaseServer
        .from('impact_results')
        .select('*')
        .eq('simulation_id', simulationId)

      if (impactsError) throw impactsError

      return {
        simulation,
        supplyChain,
        nodes: nodes || [],
        edges: edges || [],
        existingImpacts: existingImpacts || []
      }
    } catch (error) {
      console.error('❌ Error gathering supply chain data:', error)
      throw error
    }
  }

  // Build network topology for impact propagation analysis
  private buildNetworkTopology(nodes: Node[], edges: Edge[]): Map<string, {
    node: Node,
    upstream: string[],
    downstream: string[],
    criticalityScore: number
  }> {
    console.log('🌐 Building advanced network topology for impact analysis')
    
    const topology = new Map()
    
    // Initialize topology map
    nodes.forEach(node => {
      topology.set(node.node_id, {
        node,
        upstream: [],
        downstream: [],
        criticalityScore: 0
      })
    })

    // Build connections based on edges
    edges.forEach(edge => {
      const fromNodeData = topology.get(edge.from_node_id)
      const toNodeData = topology.get(edge.to_node_id)
      
      if (fromNodeData && toNodeData) {
        fromNodeData.downstream.push(edge.to_node_id)
        toNodeData.upstream.push(edge.from_node_id)
      }
    })

    // Calculate advanced criticality scores based on multiple factors
    topology.forEach((nodeData, nodeId) => {
      const upstreamCount = nodeData.upstream.length
      const downstreamCount = nodeData.downstream.length
      const capacityFactor = nodeData.node.capacity || 1000
      const inventoryFactor = nodeData.node.current_inventory || 500
      const riskFactor = nodeData.node.risk_level || 50
      
      // Advanced criticality calculation considering:
      // 1. Network position (betweenness centrality approximation)
      // 2. Capacity constraints
      // 3. Inventory vulnerability
      // 4. Inherent risk level
      const networkCentrality = (upstreamCount * 2 + downstreamCount * 3) * 10
      const capacityWeight = (capacityFactor / 1000) * 20
      const inventoryRisk = (1000 / Math.max(inventoryFactor, 1)) * 15
      const inherentRisk = (riskFactor / 100) * 25
      
      nodeData.criticalityScore = networkCentrality + capacityWeight + inventoryRisk + inherentRisk
    })

    return topology
  }

  // Calculate comprehensive impact propagation using advanced algorithms
  private calculateImpactPropagation(
    topology: Map<string, any>,
    simulationParams: any,
    timeframe: number = 30
  ): {
    directlyAffected: string[],
    cascadingEffects: any[],
    totalImpactScore: number,
    recoveryTimeline: any[]
  } {
    console.log('📊 Calculating advanced impact propagation across supply chain')

    const directlyAffected: string[] = []
    const cascadingEffects: any[] = []
    const recoveryTimeline: any[] = []
    let totalImpactScore = 0

    // Identify directly affected nodes from simulation parameters
    if (simulationParams?.parameters?.affected_nodes) {
      if (Array.isArray(simulationParams.parameters.affected_nodes)) {
        directlyAffected.push(...simulationParams.parameters.affected_nodes)
      } else {
        directlyAffected.push(simulationParams.parameters.affected_nodes)
      }
    } else if (simulationParams?.parameters?.affectedNode) {
      directlyAffected.push(simulationParams.parameters.affectedNode)
    } else {
      // If no specific nodes defined, use highest criticality node
      const criticalNode = Array.from(topology.values())
        .sort((a: any, b: any) => b.criticalityScore - a.criticalityScore)[0]
      if (criticalNode) {
        directlyAffected.push(criticalNode.node.node_id)
      }
    }

    // Advanced Monte Carlo simulation for cascading effects
    const monteCarloRuns = 1000
    const cascadingProbabilities = new Map()

    for (let run = 0; run < monteCarloRuns; run++) {
      const processedNodes = new Set<string>()
      const impactQueue = [...directlyAffected.map(nodeId => ({ 
        nodeId, 
        impactLevel: 1, 
        day: 1,
        propagationPath: [nodeId]
      }))]

      while (impactQueue.length > 0) {
        const { nodeId, impactLevel, day, propagationPath } = impactQueue.shift()!
        
        if (processedNodes.has(nodeId) || day > timeframe) continue
        processedNodes.add(nodeId)

        const nodeData = topology.get(nodeId)
        if (!nodeData) continue

        const node = nodeData.node
        const nodeImpactScore = nodeData.criticalityScore * impactLevel

        // Calculate specific impact for this node
        const impactType = this.determineImpactType(node, impactLevel)
        const severity = this.calculateSeverity(nodeImpactScore)
        const financialImpact = this.calculateFinancialImpact(node, impactLevel)

        // Store cascading effect
        const effectKey = `${nodeId}-${impactType}`
        if (!cascadingProbabilities.has(effectKey)) {
          cascadingProbabilities.set(effectKey, {
            count: 0,
            totalFinancialImpact: 0,
            paths: new Set(),
            severities: [],
            timelines: []
          })
        }

        const effect = cascadingProbabilities.get(effectKey)
        effect.count++
        effect.totalFinancialImpact += financialImpact
        effect.paths.add(propagationPath.join(' → '))
        effect.severities.push(severity)
        effect.timelines.push(`Day ${day}`)

        totalImpactScore += nodeImpactScore

        // Propagate to downstream nodes with probability decay
        nodeData.downstream.forEach((downstreamId: string) => {
          const propagationProbability = Math.random()
          const decayFactor = 0.7 * Math.pow(0.9, day - 1) // Probability decreases over time
          
          if (propagationProbability < decayFactor && impactLevel > 0.1) {
            const newImpactLevel = impactLevel * (0.6 + Math.random() * 0.3) // Random impact reduction
            const propagationDelay = Math.floor(Math.random() * 3) + 1 // 1-3 day delay
            
            impactQueue.push({
              nodeId: downstreamId,
              impactLevel: newImpactLevel,
              day: day + propagationDelay,
              propagationPath: [...propagationPath, downstreamId]
            })
          }
        })

        // Add recovery timeline entry
        if (Math.random() < 0.3) { // Only add some entries to avoid clutter
          const recoveryTime = this.calculateRecoveryTime(node, impactLevel)
          recoveryTimeline.push({
            day: day,
            nodeId: nodeId,
            nodeName: node.name,
            action: this.determineRecoveryAction(node, impactLevel),
            recoveryTime: recoveryTime,
            cost: financialImpact * 0.2 // Recovery cost is typically 20% of impact
          })
        }
      }
    }

    // Convert Monte Carlo results to final cascading effects
    cascadingProbabilities.forEach((effect, effectKey) => {
      const [nodeId, impactType] = effectKey.split('-')
      const nodeData = topology.get(nodeId)
      if (!nodeData) return

      const probability = effect.count / monteCarloRuns
      const avgFinancialImpact = effect.totalFinancialImpact / effect.count
      const mostCommonSeverity = this.getMostCommon(effect.severities)
      const avgTimeline = this.getMostCommon(effect.timelines)

      cascadingEffects.push({
        affectedNode: nodeData.node.name,
        impactType: impactType,
        severity: mostCommonSeverity,
        timeline: avgTimeline,
        propagationPath: Array.from(effect.paths).slice(0, 3), // Top 3 paths
        probability: probability,
        financialImpact: Math.round(avgFinancialImpact),
        mitigationComplexity: probability > 0.7 ? 'HIGH' : probability > 0.4 ? 'MEDIUM' : 'LOW'
      })
    })

    // Sort effects by probability and financial impact
    cascadingEffects.sort((a, b) => 
      (b.probability * b.financialImpact) - (a.probability * a.financialImpact)
    )

    // Sort recovery timeline by day
    recoveryTimeline.sort((a, b) => a.day - b.day)

    return {
      directlyAffected,
      cascadingEffects: cascadingEffects.slice(0, 15), // Top 15 effects
      totalImpactScore,
      recoveryTimeline: recoveryTimeline.slice(0, 20) // Top 20 recovery actions
    }
  }

  private determineImpactType(node: Node, impactLevel: number): string {
    const impactTypes = {
      supplier: ['Supply Disruption', 'Quality Issues', 'Delivery Delays'],
      manufacturer: ['Production Halt', 'Capacity Reduction', 'Quality Control Issues'],
      warehouse: ['Inventory Shortage', 'Distribution Delays', 'Storage Issues'],
      distribution: ['Logistics Bottleneck', 'Route Disruption', 'Delivery Delays'],
      port: ['Shipping Delays', 'Cargo Handling Issues', 'Transportation Bottleneck'],
      default: ['Operational Disruption', 'Performance Degradation', 'Service Issues']
    }

    const nodeType = node.type ? node.type.toLowerCase() : 'default'
    const relevantImpacts = impactTypes[nodeType as keyof typeof impactTypes] || impactTypes.default
    const index = Math.floor(impactLevel * relevantImpacts.length)
    return relevantImpacts[Math.min(index, relevantImpacts.length - 1)]
  }

  private calculateSeverity(impactScore: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (impactScore > 80) return 'CRITICAL'
    if (impactScore > 60) return 'HIGH'
    if (impactScore > 35) return 'MEDIUM'
    return 'LOW'
  }

  private calculateFinancialImpact(node: Node, impactLevel: number): number {
    const baseImpact = (node.capacity || 1000) * 100 // Base cost per unit capacity
    const riskMultiplier = 1 + ((node.risk_level || 50) / 100)
    const levelMultiplier = impactLevel * 2
    
    return Math.round(baseImpact * riskMultiplier * levelMultiplier)
  }

  private determineRecoveryAction(node: Node, impactLevel: number): string {
    const actions = [
      'Activate backup suppliers',
      'Deploy emergency inventory',
      'Implement alternative routes',
      'Scale up production capacity',
      'Initiate damage assessment',
      'Contact insurance providers',
      'Coordinate with logistics partners',
      'Communicate with customers'
    ]
    
    const index = Math.floor(impactLevel * actions.length)
    return actions[Math.min(index, actions.length - 1)]
  }

  private calculateRecoveryTime(node: Node, impactLevel: number): number {
    const baseRecoveryTime = 2 // Base 2 days
    const complexityFactor = (node.type === 'manufacturer' || node.type === 'port') ? 2 : 1.2
    const impactFactor = 1 + (impactLevel * 2)
    
    return Math.round(baseRecoveryTime * complexityFactor * impactFactor)
  }

  private getMostCommon<T>(arr: T[]): T {
    if (arr.length === 0) return arr[0]
    
    const counts = new Map<T, number>()
    arr.forEach(item => {
      counts.set(item, (counts.get(item) || 0) + 1)
    })
    
    let maxCount = 0
    let mostCommon = arr[0]
    counts.forEach((count, item) => {
      if (count > maxCount) {
        maxCount = count
        mostCommon = item
      }
    })
    
    return mostCommon
  }

  // Store impact results in database
  private async storeImpactResults(
    simulationId: string,
    impactData: any,
    calculatedMetrics: any
  ): Promise<void> {
    try {
      console.log(`💾 Storing impact metadata for simulation ${simulationId}`)

      // Update simulation status only since result_summary column is missing in DB
      const { error: updateError } = await supabaseServer
        .from('simulations')
        .update({
          status: 'completed',
          simulated_at: new Date().toISOString()
        })
        .eq('simulation_id', simulationId)

      if (updateError) {
        console.warn('⚠️ Could not update simulation status:', updateError.message)
      } else {
        console.log('✅ Simulation status updated to completed')
      }
    } catch (error: any) {
      console.error('❌ Error in storeImpactResults (non-fatal):', error.message)
      // We don't throw here to ensure the AI analysis is still returned to the user
    }
  }

  // Main method for comprehensive impact assessment
  public async conductComprehensiveImpactAssessment(
    simulationId: string
  ): Promise<any> {
    const startTime = Date.now()
    console.log(`🚀 Starting comprehensive impact assessment for simulation ${simulationId}`)

    try {
      // Check cache first
      const cachedResult = await this.getCachedImpactAssessment(simulationId)
      if (cachedResult) {
        console.log('📋 Returning cached impact assessment')
        return cachedResult
      }

      // Check for similar scenario results
      const similarResults = await this.findSimilarScenarioResults(simulationId)
      if (similarResults) {
        console.log('🔍 Found similar scenario results, adapting for current simulation')
        await this.cacheImpactAssessment(simulationId, similarResults)
        return {
          ...similarResults,
          adapted: true,
          originalSimulationId: similarResults.originalSimulationId
        }
      }

      // Gather comprehensive data — always from Supabase
      const supplyChainData = await this.gatherSupplyChainData(simulationId)
      
      // Build memory context from previous assessments
      const memoryContext = await this.buildMemoryContext(
        supplyChainData.simulation.supply_chain_id,
        supplyChainData.simulation.scenario_type,
        simulationId
      )

      // Build network topology
      const topology = this.buildNetworkTopology(supplyChainData.nodes, supplyChainData.edges)
      
      // Calculate impact propagation
      const impactPropagation = this.calculateImpactPropagation(
        topology,
        supplyChainData.simulation,
        30
      )

      // Generate comprehensive assessment using AI
      const aiAnalysis = await this.generateAIAnalysis(
        supplyChainData,
        impactPropagation,
        memoryContext
      )

      // Store results in database
      await this.storeImpactResults(simulationId, aiAnalysis, impactPropagation)
      
      // Store in memory for future context
      await this.storeImpactMemory(simulationId, aiAnalysis, supplyChainData)

      // Cache the results
      await this.cacheImpactAssessment(simulationId, aiAnalysis)
      await this.cacheScenarioResults(simulationId, aiAnalysis)

      const processingTime = Date.now() - startTime
      console.log(`✅ Comprehensive impact assessment completed in ${processingTime}ms`)

      return {
        ...aiAnalysis,
        processingTime,
        enhanced: true,
        memoryContextAvailable: memoryContext !== 'Memory context not available (Mem0 API key not configured)'
      }

    } catch (error) {
      console.error('❌ Error in comprehensive impact assessment:', error)
      throw error
    }
  }

  // Generate AI analysis using the LLM
  private async generateAIAnalysis(supplyChainData: any, impactPropagation: any, memoryContext: string): Promise<any> {
    console.log('🤖 Generating AI-powered impact analysis')
    
    try {
      const analysisPrompt = `
You are a supply chain financial impact analyst.

DISRUPTION SCENARIO:
${JSON.stringify(supplyChainData.simulation, null, 2)}

SUPPLY CHAIN CONTEXT:
${JSON.stringify(supplyChainData.supplyChain, null, 2)}

NETWORK TOPOLOGY:
- Total Nodes: ${supplyChainData.nodes.length}
- Total Edges: ${supplyChainData.edges.length}
- Critical Infrastructure: ${supplyChainData.nodes.filter((n: any) => n.node_type === 'Infrastructure').length} nodes

HISTORICAL CONTEXT:
${memoryContext}

IMPACT PROPAGATION DATA:
${JSON.stringify(impactPropagation, null, 2)}

ANALYST INSTRUCTIONS:
Step 1 — Graph traversal: starting from the disrupted node, follow edges in their directed downstream flow. Collect every node reachable from the disrupted node, directly or transitively.
Step 2 — Per-node assessment: for each downstream node found, assign an impactType (e.g., delay, capacityLoss, shutdown, costIncrease) and calculate estimated financial loss scaled by node type, hop distance, and severity.
Step 3 — Totals: Calculate total cascading cost impact and operational days lost based on the downstream propagation.

Do not include the disrupted node itself in downstream impacts.
Do not include nodes unreachable from the disrupted node.

CRITICAL FORMATTING REQUIREMENTS:
You MUST format ALL key metrics in the following standardized, human-friendly format:
- totalCostImpact: Use format "$XXXk - $XXXk" (e.g., "$500K - $750K", "$1.2M - $1.8M")
- averageDelay: Use format "XX-XX days" (e.g., "30-45 days", "60-90 days")
- inventoryReduction: Use format "XX-XX%" (e.g., "20-30%", "15-25%")
- recoveryTime: Use format "XX-XX days" (e.g., "60-90 days", "45-75 days")
- estimatedCost (in mitigation strategies): Use format "$XXXk - $XXXk" with confidence ranges
- timeToImplement (in mitigation strategies): Use format "XX-XX days" or "XX-XX weeks"
- riskReduction (in mitigation strategies): Use format "XX-XX%" showing effectiveness range

NEVER use raw numbers or single values for these fields. Always provide ranges that reflect confidence intervals and realistic variance.
Please provide a comprehensive impact assessment matching the strict JSON schema required.
      `

      // Configure Google provider with dedicated key if available
      const google = createGoogleGenerativeAI({
        apiKey: getAIKeyForModule('agents')
      });

      let retries = 2; // max 2 retries (3 total attempts)
      while (retries >= 0) {
        try {
          const traceId = `impact-llm-${Date.now()}`;
          const traceResult = await withTrace(traceId, 'ImpactAgent', async () => {
            const agent = new LlmAgent({
              name: "impact_agent",
              description: "Expert supply chain impact assessment AI",
              instruction: "You are an expert supply chain impact assessment AI. Follow the schema exactly.",
              model: new Gemini({ 
                model: AI_MODELS.agents, 
                apiKey: getAIKeyForModule("agents")
              }),
              outputSchema: SimulationResultsSchema
            });

            const runner = new InMemoryRunner({ appName: 'impact', agent });
            let finalContent = "";
            for await (const event of runner.runEphemeral({
              userId: 'system',
              newMessage: { role: 'user', parts: [{ text: analysisPrompt + "\n\nCRITICAL: You must return a COMPLETE JSON object. Do not truncate your response. Be concise if necessary to ensure completeness." }] }
            })) {
              const text = stringifyContent(event);
              if (text) finalContent += text;
            }

            // Clean markdown JSON wrapper if present
            let cleanContent = finalContent.replace(/^```json\n/, '').replace(/\n```$/, '').trim();

            // Try to extract a valid JSON object even from truncated output
            let parsed: any = null;
            try {
              parsed = JSON.parse(cleanContent);
            } catch {
              // Attempt 1: extract outermost { ... } via regex
              const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                try { parsed = JSON.parse(jsonMatch[0]); } catch { /* still broken */ }
              }
              // Attempt 2: try closing unclosed brackets (truncated stream)
              if (!parsed) {
                let repaired = cleanContent;
                const opens = (repaired.match(/\{/g) || []).length;
                const closes = (repaired.match(/\}/g) || []).length;
                for (let i = 0; i < opens - closes; i++) repaired += '}';
                try { parsed = JSON.parse(repaired); } catch { /* give up */ }
              }
            }

            if (!parsed) {
              console.warn('⚠️ ADK returned un-parseable JSON — falling back to BFS immediately.');
              return { success: false, error: 'Truncated or invalid JSON from AI' };
            }

            return { success: true, data: parsed };
          });

          if (!traceResult.success) throw new Error(traceResult.error);
          return traceResult.data;
        } catch (error: any) {
          const errMsg: string = error?.message || '';
          // Quota/rate-limit errors or truncated JSON — no point retrying
          const isRateLimit = errMsg.includes('quota') || errMsg.includes('rate') || errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.toLowerCase().includes('overloaded') || errMsg.toLowerCase().includes('temporary');
          const isTruncated = errMsg.includes('Unexpected end of JSON') || errMsg.includes('Truncated or invalid JSON');
          if (isRateLimit || isTruncated) {
            console.error(`❌ ${isTruncated ? 'Truncated AI response' : 'AI quota/overload exceeded'} — using BFS baseline algorithm:`, errMsg);
            return this.generateFallbackImpactData(impactPropagation, supplyChainData.nodes, supplyChainData.edges, supplyChainData.simulation);
          }
          retries--;
          console.warn(`⚠️ AI generation failed. Retries left: ${retries}. Error:`, errMsg);
          if (retries < 0) {
            console.warn('❌ AI generation retries exhausted — using BFS baseline algorithm.');
            return this.generateFallbackImpactData(impactPropagation, supplyChainData.nodes, supplyChainData.edges, supplyChainData.simulation);
          }
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      return this.generateFallbackImpactData(impactPropagation, supplyChainData.nodes, supplyChainData.edges, supplyChainData.simulation);
    } catch (error) {
      console.error('❌ Error in AI analysis generation, using BFS baseline algorithm:', error)
      return this.generateFallbackImpactData(impactPropagation, supplyChainData.nodes, supplyChainData.edges, supplyChainData.simulation);
    }
  }

  // ─── BFS Baseline Impact Algorithm ───────────────────────────────────────────
  // Deterministic expert-system fallback that runs when the LLM is unavailable.
  // Uses graph traversal + rule-based cost tables to produce defensible numbers.
  // ─────────────────────────────────────────────────────────────────────────────
  private generateFallbackImpactData(impactPropagation: any, nodes: Node[] = [], edges: Edge[] = [], simulation?: any): any {
    console.log(`🔢 [BFS-BASELINE] Running deterministic impact assessment on ${nodes.length} nodes, ${edges.length} edges`);

    // ── Cost lookup table by node type (USD base cost) ──
    const BASE_COSTS: Record<string, number> = {
      port:         500000,
      factory:      300000,
      manufacturer: 300000,
      supplier:     200000,
      warehouse:     80000,
      distributor:   60000,
      retailer:      40000,
      other:         30000,
    };

    // ── Hop decay (impact weakens with graph distance) ──
    const getHopDecay = (hop: number): number => {
      if (hop === 1) return 1.0;
      if (hop === 2) return 0.5;
      if (hop === 3) return 0.2;
      return 0.05;
    };

    // ── Impact type multiplier ──
    const IMPACT_MULTIPLIER: Record<string, number> = {
      shutdown:      1.5,
      capacityLoss:  1.0,
      delay:         0.6,
      costIncrease:  0.3,
    };

    // ── Assign impact type by hop distance and node type ──
    const getImpactType = (nodeType: string, hop: number): string => {
      const t = nodeType.toLowerCase();
      if (hop === 1) {
        if (t === 'factory' || t === 'manufacturer' || t === 'port') return 'shutdown';
        return 'capacityLoss';
      }
      if (hop === 2) return 'delay';
      return 'costIncrease';
    };

    // ── Step 1: Build downstream adjacency map ──
    const downstream = new Map<string, string[]>();
    const nodeById = new Map<string, any>();
    nodes.forEach(n => {
      nodeById.set(n.node_id, n);
      downstream.set(n.node_id, []);
    });
    edges.forEach(e => {
      const list = downstream.get(e.from_node_id) || [];
      list.push(e.to_node_id);
      downstream.set(e.from_node_id, list);
    });

    // ── Step 2: Determine seed (disrupted) nodes ──
    const directlyAffected: string[] = impactPropagation?.directlyAffected || [];
    const seedNodes = directlyAffected.length > 0
      ? directlyAffected
      : (nodes.length > 0 ? [nodes[0].node_id] : []);

    // ── Step 3: BFS from disrupted nodes ──
    const visited = new Set<string>(seedNodes);
    const queue: Array<{ nodeId: string; hop: number; path: string[] }> =
      seedNodes.map(id => ({ nodeId: id, hop: 1, path: [id] }));

    interface ImpactRecord {
      nodeId: string; nodeName: string; nodeType: string;
      impactType: string; estimatedLoss: number; hop: number; path: string[];
    }
    const downstreamImpacts: ImpactRecord[] = [];
    let head = 0;
    while (head < queue.length) {
      const { nodeId, hop, path } = queue[head++];
      const node = nodeById.get(nodeId);
      if (!node) continue;

      const nodeType = ((node.type || node.node_type || 'other') as string).toLowerCase();
      const impactType = getImpactType(nodeType, hop);
      const baseCost = BASE_COSTS[nodeType] ?? BASE_COSTS['other'];
      const estimatedLoss = Math.round(baseCost * getHopDecay(hop) * IMPACT_MULTIPLIER[impactType]);

      downstreamImpacts.push({
        nodeId,
        nodeName: node.name || node.label || nodeId,
        nodeType,
        impactType,
        estimatedLoss,
        hop,
        path,
      });

      for (const neighborId of (downstream.get(nodeId) || [])) {
        if (!visited.has(neighborId)) {
          visited.add(neighborId);
          queue.push({ nodeId: neighborId, hop: hop + 1, path: [...path, neighborId] });
        }
      }
    }

    // ── Step 4: Compute totals ──
    const totalCostImpact = downstreamImpacts.reduce((s, n) => s + n.estimatedLoss, 0);
    const shutdownCount    = downstreamImpacts.filter(n => n.impactType === 'shutdown').length;
    const capacityLossCount = downstreamImpacts.filter(n => n.impactType === 'capacityLoss').length;
    const delayCount       = downstreamImpacts.filter(n => n.impactType === 'delay').length;
    const costIncreaseCount = downstreamImpacts.filter(n => n.impactType === 'costIncrease').length;
    const operationalDaysLost = Math.min(30, shutdownCount * 7 + capacityLossCount * 3 + delayCount * 1);

    const formatCost = (n: number): string => {
      if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M - $${(n * 1.4 / 1_000_000).toFixed(1)}M`;
      return `$${Math.round(n / 1000)}K - $${Math.round(n * 1.4 / 1000)}K`;
    };

    const totalNodes = nodes.length;
    const totalEdges = edges.length;
    const networkDensity = totalNodes > 1
      ? parseFloat((totalEdges / (totalNodes * (totalNodes - 1))).toFixed(3))
      : 0;
    const maxHop = downstreamImpacts.length > 0 ? Math.max(...downstreamImpacts.map(n => n.hop)) : 0;
    const avgHop = downstreamImpacts.length > 0
      ? parseFloat((downstreamImpacts.reduce((s, n) => s + n.hop, 0) / downstreamImpacts.length).toFixed(1))
      : 1;

    // ── Step 5: Build schema-conforming cascading effects ──
    const cascadingEffects = downstreamImpacts.map(impact => ({
      affectedNode: impact.nodeName,
      impactType: impact.impactType === 'shutdown' || impact.impactType === 'capacityLoss' ? 'operational' : impact.impactType === 'delay' ? 'supply' : 'financial',
      severity: impact.impactType === 'shutdown' ? 'CRITICAL' : impact.impactType === 'capacityLoss' ? 'HIGH' : impact.impactType === 'delay' ? 'MEDIUM' : 'LOW',
      timeline: impact.hop === 1 ? 'Immediate (Day 1–3)' : impact.hop === 2 ? 'Short-term (Day 4–10)' : 'Medium-term (Day 11–30)',
      propagationPath: impact.path.map(id => nodeById.get(id)?.name || nodeById.get(id)?.label || id),
      probability: impact.impactType === 'shutdown' ? 0.95 : impact.impactType === 'capacityLoss' ? 0.80 : impact.impactType === 'delay' ? 0.65 : 0.40,
      financialImpact: formatCost(impact.estimatedLoss),
      mitigationComplexity: impact.impactType === 'shutdown' ? 'HIGH' : impact.impactType === 'capacityLoss' ? 'MEDIUM' : 'LOW',
    }));

    console.log(`✅ [BFS-BASELINE] Identified ${downstreamImpacts.length} affected nodes across ${maxHop} hops. Total exposure: ${formatCost(totalCostImpact)}`);

    return {
      scenarioName: simulation?.name || 'Disruption Analysis',
      scenarioType: simulation?.scenario_type || 'Infrastructure',
      status: 'completed',
      completedAt: new Date().toISOString(),
      metrics: {
        totalCostImpact: formatCost(totalCostImpact),
        averageDelay: `${operationalDaysLost}-${Math.min(30, operationalDaysLost + 10)} days`,
        inventoryReduction: shutdownCount > 0 ? '20-35%' : capacityLossCount > 0 ? '10-20%' : '5-10%',
        recoveryTime: `${operationalDaysLost * 2}-${operationalDaysLost * 3 || 7} days`,
        affectedNodes: downstreamImpacts.length,
        criticalPath: downstreamImpacts
          .filter(n => n.impactType === 'shutdown')
          .map(n => n.nodeName)
          .join(' → ') || (downstreamImpacts[0]?.nodeName ?? 'No critical path identified'),
        networkResilience: Math.max(0, Math.round(100 - (downstreamImpacts.length / Math.max(1, totalNodes)) * 100)),
        cascadingProbability: Math.min(0.95, 0.3 + downstreamImpacts.length * 0.05),
      },
      keyFindings: [
        `BFS traversal from ${seedNodes.length} disrupted node(s) reached ${downstreamImpacts.length} downstream node(s) across ${maxHop} hop(s).`,
        `${shutdownCount} node(s) face complete operational shutdown — highest priority recovery targets.`,
        `${capacityLossCount} node(s) operating at reduced capacity; ${delayCount} node(s) experiencing throughput delays.`,
        `Estimated total financial exposure: ${formatCost(totalCostImpact)} (conservative to upper-bound range).`,
        `Operational recovery baseline: ${operationalDaysLost} days under current network topology.`,
        'Analysis generated by deterministic BFS expert system (baseline mode — AI provider unavailable).',
      ],
      impactBreakdown: [
        `Hop 1 — Direct shutdowns: ${shutdownCount} node(s), exposure ${formatCost(downstreamImpacts.filter(n => n.impactType === 'shutdown').reduce((s, n) => s + n.estimatedLoss, 0))}.`,
        `Hop 1 — Capacity reductions: ${capacityLossCount} node(s), throughput reduced 40–60%.`,
        `Hop 2 — Downstream delays: ${delayCount} node(s), deferring throughput by up to ${operationalDaysLost} days.`,
        `Hop 3+ — Cost pressures: ${costIncreaseCount} node(s), elevated operational costs without shutdown.`,
        `Network density ${networkDensity} — ${networkDensity < 0.3 ? 'sparse topology increases single-point-of-failure risk' : 'moderate redundancy provides some buffering'}.`,
      ],
      riskFactors: [
        'Deterministic BFS identifies structural blast radius but does not capture stochastic demand variability.',
        `${shutdownCount} critical node(s) with no bypass in current graph topology.`,
        'Cost estimates use industry-average base costs per node type; actual exposure may vary by 40%.',
      ],
      mitigationStrategies: [
        {
          strategy: 'Activate emergency rerouting through secondary nodes to bypass shutdown facilities.',
          estimatedCost: formatCost(Math.round(totalCostImpact * 0.15)),
          timeToImplement: '2-5 days',
          riskReduction: '40-55%',
          feasibility: 'HIGH',
          priority: 'IMMEDIATE',
          dependencies: ['Secondary node availability', 'Logistics coordination'],
          successProbability: 0.80,
          roi: 3.2,
        },
        {
          strategy: 'Deploy safety stock from unaffected warehouses to buffer downstream shortfalls.',
          estimatedCost: formatCost(Math.round(totalCostImpact * 0.08)),
          timeToImplement: '1-3 days',
          riskReduction: '20-30%',
          feasibility: 'HIGH',
          priority: 'IMMEDIATE',
          dependencies: ['Inventory visibility', 'Transport capacity'],
          successProbability: 0.85,
          roi: 4.1,
        },
        {
          strategy: 'Negotiate expedited contracts with alternate suppliers or 3PL providers for affected routes.',
          estimatedCost: formatCost(Math.round(totalCostImpact * 0.25)),
          timeToImplement: '7-14 days',
          riskReduction: '55-70%',
          feasibility: 'MEDIUM',
          priority: 'SHORT_TERM',
          dependencies: ['Vendor qualification', 'Contract approval'],
          successProbability: 0.70,
          roi: 2.5,
        },
      ],
      cascadingEffects,
      networkAnalysis: {
        totalNodes,
        totalEdges,
        networkDensity,
        criticalNodes: downstreamImpacts.filter(n => n.impactType === 'shutdown').map(n => n.nodeName),
        singlePointsOfFailure: downstreamImpacts.filter(n => n.impactType === 'shutdown' && n.hop === 1).map(n => n.nodeName),
        alternativeRoutes: Math.max(0, totalEdges - downstreamImpacts.length),
        averageShortestPath: avgHop,
        clusteringCoefficient: parseFloat(Math.min(0.8, networkDensity * 2).toFixed(2)),
      },
      confidenceScore: nodes.length > 0 ? 0.72 : 0.40,
      monteCarloRuns: 0,
      analysisDepth: nodes.length > 0 ? 'INTERMEDIATE' : 'BASIC',
      processingTime: 0,
      dataQuality: {
        completeness: nodes.length > 0 ? 0.85 : 0.40,
        consistency: 0.90,
        recency: 0.75,
      },
      isBaselineFallback: true,
    };
  }
}

// API Route Handler
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const { searchParams } = new URL(request.url)
    const simulationId = searchParams.get('simulationId')
    
    if (!simulationId) {
      return NextResponse.json({
        success: false,
        error: 'Simulation ID is required'
      }, { status: 400 })
    }

    console.log(`🎯 GET Impact assessment for simulation: ${simulationId}`)
    
    const agent = new ProductionImpactAssessmentAgent()
    const result = await agent.conductComprehensiveImpactAssessment(simulationId)
    
    return NextResponse.json({
      success: true,
      data: result,
      processingTime: Date.now() - startTime
    })
    
  } catch (error) {
    console.error('❌ GET Impact assessment error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      fallback: true
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { simulationId, forceRefresh = false } = body
    
    if (!simulationId) {
      return NextResponse.json({
        success: false,
        error: 'Simulation ID is required'
      }, { status: 400 })
    }

    console.log(`🎯 POST Impact assessment for simulation: ${simulationId} (force: ${forceRefresh})`)
    
    const audit = agentAudit('ImpactAgent', 'system');
    audit.start(`Impact assessment for simulation ${simulationId}`);

    const agent = new ProductionImpactAssessmentAgent()
    
    // Clear cache if force refresh is requested
    if (forceRefresh) {
      try {
        await getRedisClient().del(`impact_assessment_v2:${simulationId}`)
        console.log('🗑️ Cache cleared for force refresh')
      } catch (redisErr) {
        console.warn('⚠️ Redis cache clear skipped (Redis unavailable):', (redisErr as any)?.message)
      }
    }
    
    const result = await agent.conductComprehensiveImpactAssessment(simulationId)
    
    audit.success(`Impact assessment completed for simulation ${simulationId}`);

    return NextResponse.json({
      success: true,
      data: result,
      enhanced: true,
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    console.error('❌ POST Impact assessment error:', error)
    const deepCause = error?.cause?.toString() || error?.message || 'Unknown error occurred';
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      details: deepCause
    }, { status: 500 })
  }
}
