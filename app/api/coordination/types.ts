import { z } from 'zod';

/**
 * Core coordination interfaces for multi-agent system
 */

export interface CoordinationContext {
  sessionId: string;
  initiatingAgent: string;
  currentAgent: string;
  workflowStage: 'intelligence' | 'forecast' | 'scenario' | 'impact' | 'strategy' | 'complete';
  sharedData: any;
  agentRecommendations: AgentRecommendation[];
  timestamp: Date;
  userQuery: string;
  nodeId?: string;
}

export interface AgentRecommendation {
  fromAgent: string;
  toAgent: string;
  reason: string;
  priority: 'low' | 'medium' | 'high';
  confidence: number; // 0-1 scale
  dataToPass: any;
  timestamp: Date;
}

export interface AgentCapabilities {
  id: string;
  name: string;
  description: string;
  specializations: string[];
  inputTypes: string[];
  outputTypes: string[];
  averageProcessingTime: number; // in seconds
  confidenceThresholds: {
    minimum: number;
    optimal: number;
  };
  dependencies: string[]; // other agents this one typically works with
}

export interface CoordinationResult {
  originalResult: any;
  coordinationMetadata: {
    handledBy: string;
    processingTime: number;
    timestamp: string;
    nextRecommendation?: {
      agent: string;
      reason: string;
      confidence: number;
      urgency: 'low' | 'medium' | 'high';
    };
    contextPassed: boolean;
    workflowStage: string;
  };
}

export interface OrchestratorRequest {
  query: string;
  nodeId?: string;
  userId?: string;
  supplyChainId?: string;
  context?: CoordinationContext;
  preferences?: {
    speed: 'fast' | 'balanced' | 'thorough';
    depth: 'basic' | 'detailed' | 'comprehensive';
    includeRecommendations: boolean;
  };
}

export interface OrchestratorResponse {
  analysis: string;
  coordinationLogs: CoordinationStep[];
  totalSteps: number;
  agentsInvolved: string[];
  processingTime: number;
  workflowEfficiency: number; // 0-1 scale
  finalRecommendations?: string[];
}

export interface CoordinationStep {
  stepNumber: number;
  agent: string;
  action: string;
  reasoning: string;
  input: any;
  output: any;
  processingTime: number;
  nextAgentRecommendation?: {
    agent: string;
    reason: string;
  };
}

// Zod schemas for validation
export const AgentRecommendationSchema = z.object({
  nextAgent: z.enum(['info', 'forecast', 'scenario', 'impact', 'strategy', 'complete', 'none']),
  reasoning: z.string(),
  confidence: z.number().min(0).max(1),
  priority: z.enum(['low', 'medium', 'high']),
  dataToPass: z.any().optional(),
  urgency: z.enum(['low', 'medium', 'high']).optional()
});

export const CoordinationContextSchema = z.object({
  sessionId: z.string(),
  userQuery: z.string(),
  nodeId: z.string().optional(),
  workflowStage: z.enum(['intelligence', 'forecast', 'scenario', 'impact', 'strategy', 'complete']),
  sharedData: z.any(),
  timestamp: z.string()
});

// Agent capability definitions
export const AGENT_CAPABILITIES: Record<string, AgentCapabilities> = {
  info: {
    id: 'info',
    name: 'Intelligence Agent',
    description: 'Real-time supply chain intelligence gathering and analysis',
    specializations: [
      'real-time data collection',
      'weather impact analysis',
      'port disruption monitoring',
      'market intelligence',
      'external API integration'
    ],
    inputTypes: ['nodeId', 'location', 'supply_chain_context'],
    outputTypes: ['intelligence_report', 'risk_assessment', 'real_time_data'],
    averageProcessingTime: 15, // seconds
    confidenceThresholds: {
      minimum: 0.7,
      optimal: 0.85
    },
    dependencies: ['forecast', 'scenario']
  },

  forecast: {
    id: 'forecast',
    name: 'Forecast Agent',
    description: 'Predictive analytics and trend forecasting',
    specializations: [
      'temporal pattern analysis',
      'demand forecasting',
      'supply prediction',
      'trend identification',
      'future risk assessment'
    ],
    inputTypes: ['intelligence_data', 'historical_data', 'time_series'],
    outputTypes: ['forecast_report', 'trend_analysis', 'predictions'],
    averageProcessingTime: 20,
    confidenceThresholds: {
      minimum: 0.6,
      optimal: 0.8
    },
    dependencies: ['scenario', 'impact']
  },

  scenario: {
    id: 'scenario',
    name: 'Scenario Agent',
    description: 'What-if analysis and disruption scenario modeling',
    specializations: [
      'disruption simulation',
      'what-if modeling',
      'scenario generation',
      'contingency planning',
      'risk scenario analysis'
    ],
    inputTypes: ['forecast_data', 'intelligence_data', 'risk_parameters'],
    outputTypes: ['scenario_set', 'disruption_models', 'contingency_plans'],
    averageProcessingTime: 25,
    confidenceThresholds: {
      minimum: 0.65,
      optimal: 0.82
    },
    dependencies: ['impact', 'strategy']
  },

  impact: {
    id: 'impact',
    name: 'Impact Agent',
    description: 'Quantitative risk assessment and Monte Carlo analysis',
    specializations: [
      'monte carlo simulation',
      'quantitative risk analysis',
      'impact quantification',
      'probability assessment',
      'financial impact modeling'
    ],
    inputTypes: ['scenario_data', 'risk_parameters', 'supply_chain_model'],
    outputTypes: ['impact_assessment', 'risk_scores', 'probability_analysis'],
    averageProcessingTime: 30,
    confidenceThresholds: {
      minimum: 0.75,
      optimal: 0.9
    },
    dependencies: ['strategy']
  },

  strategy: {
    id: 'strategy',
    name: 'Strategy Agent',
    description: 'Actionable mitigation strategy development',
    specializations: [
      'mitigation planning',
      'strategy formulation',
      'action plan development',
      'resource allocation',
      'implementation roadmaps'
    ],
    inputTypes: ['impact_data', 'scenario_data', 'business_constraints'],
    outputTypes: ['strategy_plan', 'action_items', 'implementation_roadmap'],
    averageProcessingTime: 35,
    confidenceThresholds: {
      minimum: 0.7,
      optimal: 0.85
    },
    dependencies: []
  }
};

// Utility functions
export function createCoordinationSession(userQuery: string, nodeId?: string): CoordinationContext {
  return {
    sessionId: `coord_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    initiatingAgent: 'orchestrator',
    currentAgent: 'orchestrator',
    workflowStage: 'intelligence',
    sharedData: {},
    agentRecommendations: [],
    timestamp: new Date(),
    userQuery,
    nodeId
  };
}

export function getOptimalWorkflowPath(startingAgent: string): string[] {
  const workflows = {
    info: ['info', 'forecast', 'scenario', 'impact', 'strategy'],
    forecast: ['forecast', 'scenario', 'impact', 'strategy'],
    scenario: ['scenario', 'impact', 'strategy'],
    impact: ['impact', 'strategy'],
    strategy: ['strategy']
  };
  
  return workflows[startingAgent as keyof typeof workflows] || ['info', 'forecast', 'scenario', 'impact', 'strategy'];
}

export function calculateWorkflowEfficiency(steps: CoordinationStep[]): number {
  if (steps.length === 0) return 0;
  
  const totalTime = steps.reduce((sum, step) => sum + step.processingTime, 0);
  const optimalTime = steps.length * 15; // Assuming 15s optimal per step
  
  return Math.max(0, Math.min(1, optimalTime / totalTime));
}

export function determineStartingAgent(query: string): string {
  const queryLower = query.toLowerCase();
  
  // Keywords that indicate specific starting points
  if (queryLower.includes('forecast') || queryLower.includes('predict') || queryLower.includes('trend')) {
    return 'forecast';
  }
  
  if (queryLower.includes('scenario') || queryLower.includes('what-if') || queryLower.includes('simulate')) {
    return 'scenario';
  }
  
  if (queryLower.includes('impact') || queryLower.includes('monte carlo') || queryLower.includes('risk assessment')) {
    return 'impact';
  }
  
  if (queryLower.includes('strategy') || queryLower.includes('mitigation') || queryLower.includes('action plan')) {
    return 'strategy';
  }
  
  // Default to intelligence gathering for general queries
  return 'info';
}

export function getAgentEndpoint(agentId: string): string {
  const endpoints = {
    info: '/api/agent/info',
    forecast: '/api/agent/forecast',
    scenario: '/api/agent/scenario',
    impact: '/api/agent/impact',
    strategy: '/api/agent/strategy'
  };
  
  return endpoints[agentId as keyof typeof endpoints] || '/api/agent/info';
}
