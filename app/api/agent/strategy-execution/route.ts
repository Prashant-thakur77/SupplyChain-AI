import { NextRequest, NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { z } from 'zod'
import { supabaseServer as supabase } from '@/lib/supabase/server'
import { AI_MODELS, getAIKeyForModule } from '@/lib/ai-config'

// Schema for generating strategy execution data
const TaskSchema = z.object({
  id: z.string().optional().describe('ID for the task - will be auto-generated if not provided'),
  title: z.string().describe('Specific actionable task title'),
  status: z.enum(['To Do', 'In Progress', 'Blocked', 'Done']),
  deadline: z.string().describe('Deadline in days (e.g., "3 days", "1 week")'),
  priority: z.enum(['critical', 'high', 'medium', 'low']),
  assignee: z.string().describe('Person assigned to this task'),
  blocker: z.string().optional().describe('What is blocking this task if status is Blocked'),
  startDate: z.string().describe('Start date in YYYY-MM-DD format'),
  duration: z.number().describe('Duration in days'),
  nodeName: z.string()
})

const NodeSchema = z.object({
  id: z.string().optional().describe('ID for the node - will be auto-generated if not provided'),
  name: z.string(),
  riskLevel: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
  confidence: z.number().min(0).max(1).describe('Confidence score between 0 and 1'),
  status: z.enum(['Planning', 'In Progress', 'Completed', 'On Hold']),
  assignedTeam: z.string().describe('Team responsible for this node'),
  tasks: z.array(TaskSchema)
})

const StrategyExecutionSchema = z.object({
  id: z.string().optional().describe('ID for the strategy - will be auto-generated if not provided'),
  name: z.string(),
  type: z.string().describe('Type of strategy (e.g., Dual Sourcing, Capacity Optimization)'),
  status: z.enum(['active', 'planning', 'completed', 'on-hold']),
  priority: z.enum(['critical', 'high', 'medium', 'low']),
  progress: z.number().min(0).max(100).describe('Progress percentage'),
  estimatedCompletion: z.string().describe('Estimated completion time (e.g., "14 days", "3 weeks")'),
  cost: z.string().describe('Cost estimate with currency (e.g., "$2.4M")'),
  roi: z.string().describe('ROI percentage (e.g., "+18%")'),
  confidence: z.number().min(0).max(1).describe('Confidence in strategy success'),
  riskReduction: z.string().describe('Risk reduction percentage (e.g., "45%")'),
  affectedNodes: z.number().describe('Number of nodes affected'),
  totalTasks: z.number().describe('Total number of tasks'),
  completedTasks: z.number().describe('Number of completed tasks'),
  description: z.string().describe('Detailed description of the strategy'),
  lastUpdated: z.string().describe('Last updated time (e.g., "2 hours ago")'),
  assignedTeam: z.string().describe('Main team responsible'),
  teamLead: z.string().describe('Team lead name'),
  riskLevel: z.enum(['critical', 'high', 'medium', 'low']),
  scenarioSource: z.string().describe('Source scenario that triggered this strategy'),
  dateFinalized: z.string().describe('Date when strategy was finalized (YYYY-MM-DD)'),
  nodes: z.array(NodeSchema)
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { strategyId, supplyChainContext, scenarioType, organizationInfo } = body

    if (!strategyId) {
      return NextResponse.json(
        { success: false, error: 'Strategy ID is required' },
        { status: 400 }
      )
    }

    console.log(`🤖 Generating dynamic strategy execution data for strategy: ${strategyId}`)

    // Fetch strategy details from database
    const { data: strategy, error: strategyError } = await supabase
      .from('strategies')
      .select('*')
      .eq('strategy_id', strategyId)
      .single()

    if (strategyError || !strategy) {
      return NextResponse.json(
        { success: false, error: 'Strategy not found' },
        { status: 404 }
      )
    }

    // Fetch supply chain context if available
    let supplyChainData = null
    if (supplyChainContext?.supplyChainId) {
      const { data: sc, error: scError } = await supabase
        .from('supply_chains')
        .select(`
          *,
          nodes(*),
          edges(*)
        `)
        .eq('supply_chain_id', supplyChainContext.supplyChainId)
        .single()

      if (!scError && sc) {
        supplyChainData = sc
      }
    }

    // Generate AI-powered strategy execution data
    const executionPrompt = `
As an expert supply chain strategy execution specialist, generate a comprehensive execution plan for the following strategy:

STRATEGY DETAILS:
- Title: ${strategy.strategy_title}
- Description: ${strategy.description}
- Strategy Type: ${strategy.details?.type || 'Risk Mitigation'}
- ROI Estimate: ${strategy.estimated_roi || 'Unknown'}%
- Cost Estimate: $${(strategy.cost_estimate || 2400000) / 1000000}M
- Implementation Time: ${strategy.implementation_time || '14 days'}
- Risk Reduction: ${strategy.risk_reduction || 45}%

SUPPLY CHAIN CONTEXT:
${supplyChainData ? `
- Organization: ${supplyChainData.name}
- Total Nodes: ${supplyChainData.nodes?.length || 0}
- Network Type: ${supplyChainData.description}
- Key Locations: ${supplyChainData.nodes?.slice(0, 3).map((n: any) => n.name).join(', ') || 'Various'}
` : 'Limited supply chain context available'}

SCENARIO TYPE: ${scenarioType || 'Supply Chain Disruption'}

ORGANIZATION INFO:
${organizationInfo ? `
- Industry: ${organizationInfo.industry}
- Size: ${organizationInfo.employeeCount} employees
- Location: ${organizationInfo.location}
` : 'General organization'}

REQUIREMENTS:
1. Generate a realistic execution strategy with 3-5 critical nodes
2. Each node should have 2-4 specific, actionable tasks
3. Include realistic team assignments, deadlines, and priorities
4. Consider real-world implementation challenges and dependencies
5. Ensure task distribution reflects actual project management practices
6. Include a mix of task statuses to show active execution
7. Use realistic names for assignees and teams
8. Consider industry-specific terminology and practices
9. DO NOT generate IDs for nodes or tasks - let the database auto-generate UUIDs

Create a comprehensive execution plan that demonstrates active progress and realistic implementation details.
    `

    const google = createGoogleGenerativeAI({ apiKey: getAIKeyForModule('agents') })
    const result = await generateObject({
      model: google(AI_MODELS.agents),
      schema: StrategyExecutionSchema,
      prompt: executionPrompt,
      maxTokens: 4000,
      temperature: 0.3
    })

    const executionData = result.object

    // Ensure data consistency
    executionData.totalTasks = executionData.nodes.reduce((total, node) => total + node.tasks.length, 0)
    executionData.completedTasks = executionData.nodes.reduce((total, node) => 
      total + node.tasks.filter(task => task.status === 'Done').length, 0)
    executionData.affectedNodes = executionData.nodes.length
    
    // Calculate progress based on completed tasks
    if (executionData.totalTasks > 0) {
      executionData.progress = Math.round((executionData.completedTasks / executionData.totalTasks) * 100)
    }

    console.log(`✅ Generated execution data with ${executionData.totalTasks} tasks across ${executionData.affectedNodes} nodes`)

    return NextResponse.json({
      success: true,
      data: executionData,
      metadata: {
        generatedAt: new Date().toISOString(),
        strategyId,
        tasksGenerated: executionData.totalTasks,
        nodesGenerated: executionData.affectedNodes
      }
    })

  } catch (error) {
    console.error('❌ Error generating strategy execution data:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate strategy execution data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve existing execution data
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

    // Try to fetch from finalized_strategies first
    const { data: strategy, error } = await supabase
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

    if (error || !strategy) {
      return NextResponse.json(
        { success: false, error: 'Strategy execution data not found' },
        { status: 404 }
      )
    }

    // Transform data to match frontend format
    const transformedData = {
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
      data: transformedData
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
