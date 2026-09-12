import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer as supabase } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    console.log('🔍 Fetching strategies for user:', userId)

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Step 1: Get supply chain IDs for the user
    const { data: userSupplyChains, error: scError } = await supabase
      .from('supply_chains')
      .select('supply_chain_id')
      .eq('user_id', userId)

    if (scError) {
      console.error('❌ Error fetching user supply chains:', scError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch user supply chains' },
        { status: 500 }
      )
    }

    if (!userSupplyChains || userSupplyChains.length === 0) {
      console.log(`ℹ️ No supply chains found for user ${userId}`)
      return NextResponse.json({
        success: true,
        data: []
      })
    }

    const supplyChainIds = userSupplyChains.map(sc => sc.supply_chain_id)

    // Step 2: Get simulation IDs for those supply chains
    const { data: userSimulations, error: simError } = await supabase
      .from('simulations')
      .select('simulation_id')
      .in('supply_chain_id', supplyChainIds)

    if (simError || !userSimulations || userSimulations.length === 0) {
      console.log(`ℹ️ No simulations found for user ${userId}`)
      return NextResponse.json({
        success: true,
        data: []
      })
    }

    const simulationIds = userSimulations.map(sim => sim.simulation_id)

    // Step 3: Get strategy IDs for those simulations
    const { data: userStrategies, error: stratError } = await supabase
      .from('strategies')
      .select('strategy_id')
      .in('simulation_id', simulationIds)

    if (stratError || !userStrategies || userStrategies.length === 0) {
      console.log(`ℹ️ No strategies found for user ${userId}`)
      return NextResponse.json({
        success: true,
        data: []
      })
    }

    const strategyIds = userStrategies.map(strat => strat.strategy_id)

    // Step 4: Get finalized strategies for those strategy IDs
    const { data: strategies, error } = await supabase
      .from('finalized_strategies')
      .select(`
        id,
        name,
        type,
        status,
        priority,
        progress,
        estimated_completion,
        cost,
        roi,
        confidence,
        risk_reduction,
        affected_nodes,
        total_tasks,
        completed_tasks,
        description,
        last_updated,
        assigned_team,
        team_lead,
        risk_level,
        scenario_source,
        date_finalized,
        created_at
      `)
      .in('strategy_id', strategyIds)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error fetching user strategies:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch user strategies' },
        { status: 500 }
      )
    }

    console.log(`✅ Found ${strategies?.length || 0} strategies for user ${userId}`)

    // Transform data to match frontend format
    const transformedStrategies = strategies?.map((strategy: any) => ({
      id: strategy.id,
      name: strategy.name,
      type: strategy.type,
      status: strategy.status,
      priority: strategy.priority,
      progress: strategy.progress,
      estimatedCompletion: strategy.estimated_completion || "TBD",
      cost: strategy.cost || "$0",
      roi: strategy.roi || "0%",
      confidence: strategy.confidence || 0,
      riskReduction: strategy.risk_reduction || "0%",
      affectedNodes: strategy.affected_nodes || 0,
      totalTasks: strategy.total_tasks || 0,
      completedTasks: strategy.completed_tasks || 0,
      description: strategy.description || "No description available",
      lastUpdated: strategy.last_updated || strategy.created_at,
      assignedTeam: strategy.assigned_team || "TBD",
      teamLead: strategy.team_lead || "TBD",
      riskLevel: strategy.risk_level || "medium",
      scenarioSource: strategy.scenario_source || "Unknown",
      dateFinalized: strategy.date_finalized || new Date().toISOString().split('T')[0],
      nodes: [] // Will be populated by other API calls when needed
    })) || []

    return NextResponse.json({
      success: true,
      data: transformedStrategies
    })

  } catch (error) {
    console.error('❌ Error fetching strategies list:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch strategies list',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
