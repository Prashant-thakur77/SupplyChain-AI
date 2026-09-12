import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer as supabase } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const strategyId = searchParams.get('strategyId')

    if (!strategyId) {
      return NextResponse.json(
        { success: false, error: 'Strategy ID is required' },
        { status: 400 }
      )
    }

    // Fetch the finalized strategy data
    const { data: strategy, error: strategyError } = await supabase
      .from('finalized_strategies')
      .select(`
        *,
        strategy_nodes(
          *,
          strategy_tasks(*)
        )
      `)
      .eq('id', strategyId)
      .single()

    if (strategyError) {
      console.error('Error fetching strategy:', strategyError)
      return NextResponse.json(
        { success: false, error: 'Strategy not found' },
        { status: 404 }
      )
    }

    if (!strategy) {
      return NextResponse.json(
        { success: false, error: 'Strategy not found' },
        { status: 404 }
      )
    }

    // Transform the data to match the frontend format
    const transformedStrategy = {
      id: strategy.id,
      name: strategy.name,
      type: strategy.type,
      status: strategy.status,
      priority: strategy.priority,
      progress: strategy.progress,
      estimatedCompletion: strategy.estimated_completion,
      cost: strategy.cost,
      roi: strategy.roi,
      confidence: strategy.confidence,
      riskReduction: strategy.risk_reduction,
      affectedNodes: strategy.affected_nodes,
      totalTasks: strategy.total_tasks,
      completedTasks: strategy.completed_tasks,
      description: strategy.description,
      lastUpdated: strategy.last_updated,
      assignedTeam: strategy.assigned_team,
      teamLead: strategy.team_lead,
      riskLevel: strategy.risk_level,
      scenarioSource: strategy.scenario_source,
      dateFinalized: strategy.date_finalized,
      nodes: strategy.strategy_nodes?.map((node: any) => ({
        id: node.id,
        name: node.name,
        riskLevel: node.risk_level,
        confidence: node.confidence,
        status: node.status,
        assignedTeam: node.assigned_team,
        tasks: node.strategy_tasks?.map((task: any) => ({
          id: task.id,
          title: task.title,
          status: task.status,
          deadline: task.deadline,
          priority: task.priority,
          assignee: task.assignee,
          blocker: task.blocker,
          startDate: task.start_date,
          duration: task.duration,
          nodeName: task.node_name,
          createdAt: task.created_at,
          updatedAt: task.updated_at
        })) || []
      })) || []
    }

    return NextResponse.json({
      success: true,
      data: transformedStrategy
    })

  } catch (error) {
    console.error('❌ Error fetching strategy execution data:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch strategy execution data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      strategyId, 
      name, 
      type, 
      status = 'active',
      priority = 'high',
      progress = 0,
      estimatedCompletion,
      cost,
      roi,
      confidence,
      riskReduction,
      description,
      assignedTeam,
      teamLead,
      riskLevel = 'medium',
      scenarioSource,
      nodes = []
    } = body

    if (!strategyId || !name) {
      return NextResponse.json(
        { success: false, error: 'Strategy ID and name are required' },
        { status: 400 }
      )
    }

    // Create the finalized strategy
    const { data: strategy, error: strategyError } = await supabase
      .from('finalized_strategies')
      .insert({
        strategy_id: strategyId,
        name,
        type,
        status,
        priority,
        progress,
        estimated_completion: estimatedCompletion,
        cost,
        roi,
        confidence,
        risk_reduction: riskReduction,
        affected_nodes: nodes.length,
        total_tasks: nodes.reduce((total: number, node: any) => total + (node.tasks?.length || 0), 0),
        completed_tasks: nodes.reduce((total: number, node: any) => 
          total + (node.tasks?.filter((task: any) => task.status === 'Done').length || 0), 0),
        description,
        assigned_team: assignedTeam,
        team_lead: teamLead,
        risk_level: riskLevel,
        scenario_source: scenarioSource,
        date_finalized: new Date().toISOString().split('T')[0]
      })
      .select()
      .single()

    if (strategyError) {
      console.error('Error creating strategy:', strategyError)
      return NextResponse.json(
        { success: false, error: 'Failed to create strategy' },
        { status: 500 }
      )
    }

    // Create strategy nodes and tasks
    for (const node of nodes) {
      const { data: strategyNode, error: nodeError } = await supabase
        .from('strategy_nodes')
        .insert({
          finalized_strategy_id: strategy.id,
          node_id: node.id,
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
      if (node.tasks && node.tasks.length > 0) {
        for (const task of node.tasks) {
          await supabase
            .from('strategy_tasks')
            .insert({
              strategy_node_id: strategyNode.id,
              finalized_strategy_id: strategy.id,
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
    }

    return NextResponse.json({
      success: true,
      data: { id: strategy.id, message: 'Strategy execution data created successfully' }
    })

  } catch (error) {
    console.error('❌ Error creating strategy execution data:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create strategy execution data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
