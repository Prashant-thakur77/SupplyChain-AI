export interface SupplyChainSessionState {
  // Input
  supplyChainId: string;
  nodeId?: string;
  userId: string;
  userQuery: string;

  // Intelligence layer output
  intelligenceReport?: any;
  riskScore?: number;           // 0-100

  // Forecast layer output
  forecastPoints?: any[];
  trendDirection?: 'improving' | 'stable' | 'declining' | 'volatile';
  forecastAvailable: boolean;

  // Scenario layer output
  scenarios?: any[];
  overallScenarioRisk?: number;
  scenariosAvailable: boolean;

  // Impact layer output
  financialImpact?: any;
  mitigationPriority?: 'low' | 'medium' | 'high' | 'critical';

  // Strategy layer output
  strategies?: any[];
  requiresHumanApproval?: boolean;
  approvalStatus?: 'pending' | 'approved' | 'rejected' | 'approval_timeout';

  // Metadata
  workflowStage: string;
  agentsInvoked: string[];
  agentErrors: Record<string, string>;
  startedAt: string;
  lastUpdatedAt: string;
}

export interface AgentResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  partial?: boolean;
  fallback?: string;
}
