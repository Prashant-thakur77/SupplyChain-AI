'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Brain, 
  Zap, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  Loader2,
  TrendingUp,
  BarChart3,
  Target,
  Eye,
  Cpu,
  Database
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AgentTelemetry {
  id: string;
  name: string;
  status: 'idle' | 'thinking' | 'executing' | 'complete' | 'error';
  progress: number;
  currentTask?: string;
  reasoning?: string;
  dataSource?: string;
  processingTime?: number;
  throughput?: number;
  lastUpdate: Date;
}

const AGENT_CONFIGS = {
  intelligence: {
    name: 'Intelligence Agent',
    icon: Activity,
    color: 'bg-blue-500',
    description: 'Gathering real-time market intelligence'
  },
  forecast: {
    name: 'Forecast Agent', 
    icon: TrendingUp,
    color: 'bg-purple-500',
    description: 'Analyzing predictive trends'
  },
  scenario: {
    name: 'Scenario Agent',
    icon: Brain,
    color: 'bg-orange-500', 
    description: 'Modeling disruption scenarios'
  },
  impact: {
    name: 'Impact Agent',
    icon: BarChart3,
    color: 'bg-red-500',
    description: 'Quantifying risk impact'
  },
  strategy: {
    name: 'Strategy Agent',
    icon: Target,
    color: 'bg-green-500',
    description: 'Developing mitigation strategies'
  }
};

export default function LiveAgentTelemetry({ 
  isExecuting = false,
  activeAgent = null 
}: { 
  isExecuting?: boolean;
  activeAgent?: string | null;
}) {
  const [agents, setAgents] = useState<AgentTelemetry[]>([]);
  const [systemMetrics, setSystemMetrics] = useState({
    totalRequests: 0,
    avgResponseTime: 0,
    successRate: 100,
    activeSessions: 0
  });

  // Initialize agents
  useEffect(() => {
    const initialAgents: AgentTelemetry[] = Object.entries(AGENT_CONFIGS).map(([id, config]) => ({
      id,
      name: config.name,
      status: 'idle' as const,
      progress: 0,
      lastUpdate: new Date()
    }));
    setAgents(initialAgents);
  }, []);

  // Simulate real-time telemetry updates
  useEffect(() => {
    if (!isExecuting) return;

    const interval = setInterval(() => {
      setAgents(prev => prev.map(agent => {
        if (agent.id === activeAgent) {
          // Active agent simulation
          const newProgress = Math.min(agent.progress + Math.random() * 15, 100);
          const isComplete = newProgress >= 100;
          
          return {
            ...agent,
            status: isComplete ? 'complete' : (newProgress > 50 ? 'executing' : 'thinking'),
            progress: newProgress,
            currentTask: isComplete ? 'Analysis complete' : getRandomTask(agent.id),
            reasoning: getRandomReasoning(agent.id),
            dataSource: getRandomDataSource(),
            processingTime: Math.floor(Math.random() * 3000) + 500,
            throughput: Math.floor(Math.random() * 100) + 50,
            lastUpdate: new Date()
          };
        } else if (agent.status === 'complete') {
          // Keep completed agents as complete
          return agent;
        } else {
          // Idle agents with minimal activity
          return {
            ...agent,
            progress: Math.max(0, agent.progress - Math.random() * 2),
            lastUpdate: new Date()
          };
        }
      }));

      // Update system metrics
      setSystemMetrics(prev => ({
        totalRequests: prev.totalRequests + Math.floor(Math.random() * 3),
        avgResponseTime: Math.floor(Math.random() * 2000) + 8000,
        successRate: 98 + Math.random() * 2,
        activeSessions: Math.floor(Math.random() * 5) + 1
      }));
    }, 800);

    return () => clearInterval(interval);
  }, [isExecuting, activeAgent]);

  const getRandomTask = (agentId: string): string => {
    const tasks = {
      intelligence: [
        'Scanning news feeds for disruptions',
        'Analyzing weather patterns',
        'Monitoring port congestion data',
        'Processing market indicators'
      ],
      forecast: [
        'Running predictive models',
        'Analyzing historical trends',
        'Computing demand forecasts',
        'Validating prediction accuracy'
      ],
      scenario: [
        'Generating disruption scenarios',
        'Modeling cascade effects',
        'Simulating recovery paths',
        'Calculating scenario probabilities'
      ],
      impact: [
        'Running Monte Carlo simulations',
        'Quantifying financial impact',
        'Assessing operational risks',
        'Computing ROI metrics'
      ],
      strategy: [
        'Optimizing mitigation plans',
        'Generating action items',
        'Prioritizing interventions',
        'Creating implementation timeline'
      ]
    };
    
    const agentTasks = tasks[agentId as keyof typeof tasks] || ['Processing data'];
    return agentTasks[Math.floor(Math.random() * agentTasks.length)];
  };

  const getRandomReasoning = (agentId: string): string => {
    const reasoning = {
      intelligence: [
        'Cross-referencing multiple data sources to ensure accuracy',
        'Filtering noise from signal in real-time feeds',
        'Correlating geopolitical events with supply chain impacts'
      ],
      forecast: [
        'Applying ensemble methods for robust predictions', 
        'Incorporating seasonal adjustments and trend analysis',
        'Validating forecasts against recent performance data'
      ],
      scenario: [
        'Building decision trees for multiple disruption paths',
        'Calculating propagation effects across network nodes',
        'Stress-testing scenarios under different conditions'
      ],
      impact: [
        'Running statistical analysis on potential outcomes',
        'Quantifying uncertainty bounds around estimates',
        'Incorporating stakeholder risk tolerance thresholds'
      ],
      strategy: [
        'Optimizing resource allocation across constraints',
        'Balancing short-term costs with long-term resilience',
        'Incorporating lessons learned from past incidents'
      ]
    };
    
    const agentReasoning = reasoning[agentId as keyof typeof reasoning] || ['Analyzing data patterns'];
    return agentReasoning[Math.floor(Math.random() * agentReasoning.length)];
  };

  const getRandomDataSource = (): string => {
    const sources = [
      'supply_chain_intel table',
      'forecasts database',
      'real-time API feeds',
      'historical analytics',
      'external intelligence',
      'cached predictions'
    ];
    return sources[Math.floor(Math.random() * sources.length)];
  };

  const getStatusIcon = (status: AgentTelemetry['status']) => {
    switch (status) {
      case 'thinking': return <Loader2 className="w-4 h-4 animate-spin text-yellow-500" />;
      case 'executing': return <Zap className="w-4 h-4 animate-pulse text-blue-500" />;
      case 'complete': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default: return <Eye className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: AgentTelemetry['status']) => {
    switch (status) {
      case 'thinking': return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      case 'executing': return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';
      case 'complete': return 'border-green-500 bg-green-50 dark:bg-green-900/20';
      case 'error': return 'border-red-500 bg-red-50 dark:bg-red-900/20';
      default: return 'border-border bg-muted/50';
    }
  };

  return (
    <div className="space-y-6">
      {/* System Overview */}
      <Card className="bg-card/50 border-border backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Cpu className="w-5 h-5 text-green-600 dark:text-green-400" />
            System Telemetry
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{systemMetrics.totalRequests}</div>
              <div className="text-xs text-muted-foreground">Total Requests</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{(systemMetrics.avgResponseTime / 1000).toFixed(1)}s</div>
              <div className="text-xs text-muted-foreground">Avg Response</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{systemMetrics.successRate.toFixed(1)}%</div>
              <div className="text-xs text-muted-foreground">Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{systemMetrics.activeSessions}</div>
              <div className="text-xs text-muted-foreground">Active Sessions</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agent Telemetry */}
      <Card className="bg-card/50 border-border backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Live Agent Telemetry
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800 pr-2">
          {agents.map((agent) => {
            const config = AGENT_CONFIGS[agent.id as keyof typeof AGENT_CONFIGS];
            const Icon = config?.icon || Activity;
            
            return (
              <div 
                key={agent.id}
                className={cn(
                  "p-4 rounded-lg border-2 transition-all duration-300",
                  getStatusColor(agent.status)
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", config?.color)}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-medium text-foreground">{agent.name}</div>
                      <div className="text-xs text-muted-foreground">{config?.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(agent.status)}
                    <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                      {agent.status}
                    </Badge>
                  </div>
                </div>
                
                {/* Progress Bar */}
                {agent.status !== 'idle' && (
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Progress</span>
                      <span>{Math.round(agent.progress)}%</span>
                    </div>
                    <Progress 
                      value={agent.progress} 
                      className="h-2 bg-muted"
                    />
                  </div>
                )}
                
                {/* Current Task */}
                {agent.currentTask && (
                  <div className="mb-2">
                    <div className="text-xs font-medium text-foreground mb-1">Current Task</div>
                    <div className="text-sm text-blue-600 dark:text-blue-400 break-words">⚡ {agent.currentTask}</div>
                  </div>
                )}
                
                {/* Reasoning */}
                {agent.reasoning && (
                  <div className="mb-2">
                    <div className="text-xs font-medium text-foreground mb-1">Reasoning</div>
                    <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded break-words max-h-20 overflow-y-auto scrollbar-thin">
                      💭 {agent.reasoning}
                    </div>
                  </div>
                )}
                
                {/* Metadata */}
                <div className="flex items-center justify-between text-xs text-muted-foreground flex-wrap gap-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    {agent.dataSource && (
                      <span className="flex items-center gap-1">
                        <Database className="w-3 h-3" />
                        <span className="truncate max-w-24">{agent.dataSource}</span>
                      </span>
                    )}
                    {agent.processingTime && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {agent.processingTime}ms
                      </span>
                    )}
                  </div>
                  <span className="whitespace-nowrap">Updated {agent.lastUpdate.toLocaleTimeString()}</span>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
