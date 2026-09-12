import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer as supabase } from '@/lib/supabase/server'
import { randomUUID } from 'crypto'

interface FinalizeData {
  approvedStrategies: number[]
  implementationNotes: string
  priorityAdjustments: { strategyId: number; newPriority: string }[]
  stakeholderApproval: boolean
  budgetConfirmed: boolean
  resourcesAllocated: boolean
  timelineAccepted: boolean
}

interface FinalizeRequest {
  simulationId: string
  finalizeData: FinalizeData
}

export async function POST(request: NextRequest) {
  try {
    const body: FinalizeRequest = await request.json()
    const { simulationId, finalizeData } = body

    if (!simulationId || !finalizeData) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Validate that required approvals are completed
    if (!finalizeData.stakeholderApproval || 
        !finalizeData.budgetConfirmed || 
        !finalizeData.resourcesAllocated || 
        !finalizeData.timelineAccepted) {
      return NextResponse.json(
        { success: false, error: 'All approvals must be completed before finalizing' },
        { status: 400 }
      )
    }

    console.log(`🚀 Finalizing strategies for simulation ${simulationId}`)
    console.log(`📊 Approved strategy indices:`, finalizeData.approvedStrategies)

    // Fetch all strategies from the simulation's result_summary
    const { data: simulation, error: simError } = await supabase
      .from('simulations')
      .select('result_summary')
      .eq('simulation_id', simulationId)
      .single()

    if (simError || !simulation || !simulation.result_summary?.strategyAnalysis) {
      console.error('Error fetching strategies from simulation:', simError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch strategies or none exist' },
        { status: 404 }
      )
    }

    const stratData = simulation.result_summary.strategyAnalysis
    // UI displays them all flattened in order: immediate, shortTerm, longTerm
    const allStrategies = [
      ...(stratData.immediate || []),
      ...(stratData.shortTerm || []),
      ...(stratData.longTerm || [])
    ]

    if (allStrategies.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No strategies found for this simulation' },
        { status: 404 }
      )
    }

    // Filter strategies based on the approved indices (1-based indexing from UI)
    const strategies = finalizeData.approvedStrategies
      .map((index: number) => allStrategies[index - 1]) // Convert to 0-based indexing
      .filter(Boolean) // Remove any undefined entries

    console.log(`✅ Found ${strategies.length} strategies to finalize:`, 
      strategies.map(s => ({ id: s.id, title: s.title })))

    const finalizedStrategyIds: string[] = []

    // Process each approved strategy
    for (const strategy of strategies) {
      try {
        console.log(`🔄 Processing strategy: ${strategy.title} (${strategy.id})`)
        
        // Generate execution data for this strategy
        const executionResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/agent/strategy-execution`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            strategyId: strategy.id,
            supplyChainContext: {
              supplyChainId: simulationId // Using simulation for context
            },
            scenarioType: 'Supply Chain Disruption',
            organizationInfo: {
              industry: 'Manufacturing',
              employeeCount: '1000+',
              location: 'Global'
            }
          })
        })

        if (!executionResponse.ok) {
          console.error(`❌ Failed to generate execution data for ${strategy.id}:`, 
            executionResponse.status, executionResponse.statusText)
          continue
        }

        const executionResult = await executionResponse.json()

        if (!executionResult.success) {
          console.error(`❌ Execution generation failed for ${strategy.id}:`, 
            executionResult.error)
          continue
        }

        console.log(`✅ Generated execution data for ${strategy.title}:`, {
          nodes: executionResult.data.nodes?.length || 0,
          tasks: executionResult.data.totalTasks || 0
        })

        // Create finalized strategy record
        const { data: finalizedStrategy, error: finalizeError } = await supabase
          .from('finalized_strategies')
          .insert({
            strategy_id: strategy.id,
            name: executionResult.data.name,
            type: executionResult.data.type,
            status: 'active',
            priority: executionResult.data.priority,
            progress: executionResult.data.progress,
            estimated_completion: executionResult.data.estimatedCompletion,
            cost: executionResult.data.cost,
            roi: executionResult.data.roi,
            confidence: executionResult.data.confidence,
            risk_reduction: executionResult.data.riskReduction,
            affected_nodes: executionResult.data.affectedNodes,
            total_tasks: executionResult.data.totalTasks,
            completed_tasks: executionResult.data.completedTasks,
            description: executionResult.data.description,
            assigned_team: executionResult.data.assignedTeam,
            team_lead: executionResult.data.teamLead,
            risk_level: executionResult.data.riskLevel,
            scenario_source: executionResult.data.scenarioSource,
            date_finalized: new Date().toISOString().split('T')[0]
          })
          .select()
          .single()

        if (finalizeError) {
          console.error('Error creating finalized strategy:', finalizeError)
          continue
        }

        // Create strategy nodes and tasks
        for (const node of executionResult.data.nodes) {
          const { data: strategyNode, error: nodeError } = await supabase
            .from('strategy_nodes')
            .insert({
              finalized_strategy_id: finalizedStrategy.id,
              node_id: randomUUID(), // Generate UUID for node_id
              name: node.name,
              risk_level: node.riskLevel,
              confidence: node.confidence,
              status: node.status,
              assigned_team: node.assignedTeam
            })
            .select()
            .single()

          if (nodeError) {
            console.error('Error creating strategy node:', nodeError)
            continue
          }

          // Create tasks for this node
          for (const task of node.tasks) {
            await supabase
              .from('strategy_tasks')
              .insert({
                strategy_node_id: strategyNode.id,
                finalized_strategy_id: finalizedStrategy.id,
                // Let database auto-generate task ID instead of using AI-generated ID
                title: task.title,
                status: task.status,
                deadline: task.deadline,
                priority: task.priority,
                assignee: task.assignee,
                blocker: task.blocker,
                start_date: task.startDate,
                duration: task.duration,
                node_name: task.nodeName
              })
          }
        }

        finalizedStrategyIds.push(finalizedStrategy.id)
        console.log(`✅ Finalized strategy: ${finalizedStrategy.id}`)
      } catch (error) {
        console.error(`Error processing strategy ${strategy.id}:`, error)
      }
    }

    const finalizedStrategy = {
      id: `finalized-${simulationId}-${Date.now()}`,
      simulationId,
      finalizedAt: new Date().toISOString(),
      approvedStrategies: finalizeData.approvedStrategies,
      implementationNotes: finalizeData.implementationNotes,
      status: 'finalized',
      finalizedStrategyIds,
      nextSteps: [
        'Implementation teams have been notified',
        'Resource allocation confirmed',
        'Monitoring and reporting dashboard activated',
        'Stakeholder communication plan initiated'
      ],
      trackingUrl: `/simulation?simulationId=${simulationId}`,
      estimatedCompletionDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days from now
      assignedTeams: [
        'Crisis Response Team',
        'Supply Chain Operations',
        'Risk Management',
        'Strategic Planning'
      ]
    }

    console.log(`✅ Strategy finalization completed for simulation ${simulationId}:`, {
      strategiesCount: finalizeData.approvedStrategies.length,
      finalizedCount: finalizedStrategyIds.length,
      hasNotes: !!finalizeData.implementationNotes,
      finalizedAt: finalizedStrategy.finalizedAt
    })

    return NextResponse.json({
      success: true,
      data: finalizedStrategy,
      message: 'Strategy successfully finalized and onboarded'
    })

  } catch (error) {
    console.error('❌ Error finalizing strategy:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to finalize strategy',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
