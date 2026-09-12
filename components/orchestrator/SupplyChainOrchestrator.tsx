'use client';

import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Activity, 
  Brain, 
  Zap, 
  Clock, 
  Users, 
  Target, 
  AlertTriangle,
  CheckCircle,
  Loader2,
  Play,
  Pause,
  BarChart3,
  MapPin,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AgentStatus {
  id: string;
  name: string;
  status: 'idle' | 'thinking' | 'executing' | 'complete' | 'error';
  lastAction?: string;
  processingTime?: number;
  reasoning?: string;
}

interface CoordinationStep {
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

interface OrchestratorResponse {
  analysis: string;
  coordinationLogs: CoordinationStep[];
  totalSteps: number;
  agentsInvolved: string[];
  processingTime: number;
  workflowEfficiency: number;
  finalRecommendations?: string[];
}

const AGENT_CONFIGS = {
  gatherIntelligence: {
    name: 'Intelligence Agent',
    icon: Activity,
    color: 'bg-blue-500',
    description: 'Real-time data gathering & market intelligence'
  },
  generateForecast: {
    name: 'Forecast Agent', 
    icon: TrendingUp,
    color: 'bg-purple-500',
    description: 'Predictive analytics & trend analysis'
  },
  generateScenarios: {
    name: 'Scenario Agent',
    icon: Brain,
    color: 'bg-orange-500', 
    description: 'What-if modeling & disruption simulation'
  },
  assessImpact: {
    name: 'Impact Agent',
    icon: BarChart3,
    color: 'bg-red-500',
    description: 'Monte Carlo analysis & risk assessment'
  },
  generateStrategy: {
    name: 'Strategy Agent',
    icon: Target,
    color: 'bg-green-500',
    description: 'Mitigation planning & action roadmaps'
  }
};

import { useRouter } from 'next/navigation';

export default function SupplyChainOrchestrator({ 
  initialQuery = '', 
  initialNodeId = '' 
}: {
  initialQuery?: string;
  initialNodeId?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [nodeId, setNodeId] = useState(initialNodeId);
  const [isExecuting, setIsExecuting] = useState(false);
  const [agents, setAgents] = useState<AgentStatus[]>([]);
  const [coordinationLogs, setCoordinationLogs] = useState<CoordinationStep[]>([]);
  const [finalAnalysis, setFinalAnalysis] = useState<string>('');
  const [metrics, setMetrics] = useState<{
    totalTime: number;
    efficiency: number;
    agentsUsed: number;
  }>({ totalTime: 0, efficiency: 0, agentsUsed: 0 });
  const [streamingStep, setStreamingStep] = useState<CoordinationStep | null>(null);
  
  const analysisRef = useRef<HTMLDivElement>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);

  // Initialize agents
  useEffect(() => {
    const initialAgents: AgentStatus[] = Object.keys(AGENT_CONFIGS).map(id => ({
      id,
      name: AGENT_CONFIGS[id as keyof typeof AGENT_CONFIGS].name,
      status: 'idle'
    }));
    setAgents(initialAgents);
  }, []);

  // Update query and nodeId when initial values change
  useEffect(() => {
    if (initialQuery) setQuery(initialQuery);
    if (initialNodeId) setNodeId(initialNodeId);
  }, [initialQuery, initialNodeId]);

  // Smart query suggestions
  const smartSuggestions = [
    {
      query: "Analyze supply chain risks for our electronics manufacturing",
      nodeId: "FACTORY-001",
      scenario: "Electronics Risk Assessment"
    },
    {
      query: "Evaluate impact of Port of Los Angeles congestion on logistics",
      nodeId: "LA-PORT-001", 
      scenario: "Port Disruption Analysis"
    },
    {
      query: "How will the upcoming storm affect our distribution network?",
      nodeId: "WAREHOUSE-NYC-001",
      scenario: "Weather Impact Assessment" 
    },
    {
      query: "Optimize supply chain resilience for Q1 2025",
      nodeId: "GLOBAL-NETWORK",
      scenario: "Strategic Optimization"
    }
  ];

  const executeOrchestration = async () => {
    if (!query.trim()) return;

    setIsExecuting(true);
    setCoordinationLogs([]);
    setFinalAnalysis('');
    setStreamingStep(null);
    setShowSuggestions(false);

    // Reset agent statuses
    setAgents(prev => prev.map(agent => ({ ...agent, status: 'idle' })));

    try {
      const response = await fetch('/api/agent/orchestrator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          nodeId: nodeId || undefined,
          preferences: { depth: 'comprehensive' }
        })
      });

      if (!response.ok) throw new Error('Orchestration failed');

      const result: OrchestratorResponse = await response.json();

      // Simulate live agent telemetry by processing steps with delays
      for (let i = 0; i < result.coordinationLogs.length; i++) {
        const step = result.coordinationLogs[i];
        
        // Show agent as thinking
        setAgents(prev => prev.map(agent => 
          agent.id === step.agent || AGENT_CONFIGS[step.agent as keyof typeof AGENT_CONFIGS]?.name === agent.name
            ? { ...agent, status: 'thinking', reasoning: step.reasoning }
            : agent
        ));

        await new Promise(resolve => setTimeout(resolve, 800));

        // Show agent as executing
        setAgents(prev => prev.map(agent => 
          agent.id === step.agent || AGENT_CONFIGS[step.agent as keyof typeof AGENT_CONFIGS]?.name === agent.name
            ? { ...agent, status: 'executing', lastAction: step.action }
            : agent
        ));

        await new Promise(resolve => setTimeout(resolve, 1200));

        // Add step to logs with streaming effect
        setStreamingStep(step);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setCoordinationLogs(prev => [...prev, step]);
        setStreamingStep(null);

        // Mark agent as complete
        setAgents(prev => prev.map(agent => 
          agent.id === step.agent || AGENT_CONFIGS[step.agent as keyof typeof AGENT_CONFIGS]?.name === agent.name
            ? { ...agent, status: 'complete', processingTime: step.processingTime }
            : agent
        ));

        await new Promise(resolve => setTimeout(resolve, 300));
      }

      // Stream final analysis
      setFinalAnalysis(result.analysis);
      
      // Update metrics
      setMetrics({
        totalTime: result.processingTime,
        efficiency: Math.round(result.workflowEfficiency * 100),
        agentsUsed: result.agentsInvolved.length
      });

    } catch (error) {
      console.error('Orchestration error:', error);
      setAgents(prev => prev.map(agent => ({ ...agent, status: 'error' })));
    } finally {
      setIsExecuting(false);
    }
  };

  const getAgentStatusIcon = (status: AgentStatus['status']) => {
    switch (status) {
      case 'thinking': return <Loader2 className="w-4 h-4 animate-spin text-yellow-500" />;
      case 'executing': return <Zap className="w-4 h-4 animate-pulse text-blue-500" />;
      case 'complete': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default: return <Pause className="w-4 h-4 text-gray-400" />;
    }
  };

  const getAgentStatusColor = (status: AgentStatus['status']) => {
    switch (status) {
      case 'thinking': return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20';
      case 'executing': return 'border-blue-500 bg-blue-50 dark:bg-blue-950/20';
      case 'complete': return 'border-green-500 bg-green-50 dark:bg-green-950/20';
      case 'error': return 'border-red-500 bg-red-50 dark:bg-red-950/20';
      default: return 'border-border bg-muted';
    }
  };

  return (
    <div className="min-h-full flex-1 bg-gradient-to-br from-background via-muted/20 to-background text-foreground p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
              SupplyChain AI MACG
            </h1>
            <p className="text-muted-foreground">Multi-Agent Coordination Graph - Elite Supply Chain Intelligence</p>
          </div>
        </div>
        
        {/* Live System Status */}
        <div className="flex items-center gap-4 text-sm">
          <Badge variant="outline" className="border-green-500 text-green-600 dark:text-green-400">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
            System Operational
          </Badge>
          <span className="text-muted-foreground flex items-center gap-1">
            <Clock className="w-4 h-4" />
            Response Time: ~15s (94% faster than legacy)
          </span>
          <span className="text-muted-foreground flex items-center gap-1">
            <Users className="w-4 h-4" />
            {agents.filter(a => a.status === 'complete').length}/{agents.length} Agents Ready
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Panel - Control & Input */}
        <div className="space-y-6">
          {/* Mission Control */}
          <Card className="bg-card/50 border-border backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Mission Control
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Define your supply chain intelligence objective
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Intelligence Query
                </label>
                <Textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Describe your supply chain challenge..."
                  className="bg-background/50 border-border text-foreground placeholder:text-muted-foreground min-h-[100px]"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Target Node ID (Optional)
                </label>
                <Input
                  value={nodeId}
                  onChange={(e) => setNodeId(e.target.value)}
                  placeholder="e.g., FACTORY-001, LA-PORT-001"
                  className="bg-background/50 border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>

              <Button 
                onClick={executeOrchestration}
                disabled={!query.trim() || isExecuting}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                {isExecuting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Coordinating Agents...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Execute Analysis
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Smart Suggestions */}
          {showSuggestions && (
            <Card className="bg-card/50 border-border backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-foreground text-sm">⚡ Smart Scenarios</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {smartSuggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setQuery(suggestion.query);
                      setNodeId(suggestion.nodeId);
                    }}
                    className="w-full text-left p-3 rounded-lg bg-muted/50 hover:bg-muted border border-border hover:border-border/60 transition-all"
                  >
                    <div className="font-medium text-blue-600 dark:text-blue-400 text-sm">
                      {suggestion.scenario}
                    </div>
                    <div className="text-muted-foreground text-xs mt-1">
                      {suggestion.query}
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Performance Metrics */}
          {metrics.totalTime > 0 && (
            <Card className="bg-card/50 border-border backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-foreground text-sm">⚡ Mission Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">Total Time</span>
                  <Badge variant="outline" className="border-blue-500 text-blue-600 dark:text-blue-400">
                    {(metrics.totalTime / 1000).toFixed(1)}s
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">Efficiency</span>
                  <Badge variant="outline" className="border-green-500 text-green-600 dark:text-green-400">
                    {metrics.efficiency}%
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">Agents Deployed</span>
                  <Badge variant="outline" className="border-purple-500 text-purple-600 dark:text-purple-400">
                    {metrics.agentsUsed}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Center Panel - Agent Telemetry & Coordination */}
        <div className="space-y-6">
          {/* Live Agent Status */}
          <Card className="bg-card/50 border-border backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Activity className="w-5 h-5 text-green-600 dark:text-green-400" />
                Live Agent Telemetry
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {agents.map((agent) => {
                const config = Object.values(AGENT_CONFIGS).find(c => c.name === agent.name);
                const Icon = config?.icon || Activity;
                
                return (
                  <div 
                    key={agent.id}
                    className={cn(
                      "p-4 rounded-lg border-2 transition-all duration-300",
                      getAgentStatusColor(agent.status)
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", config?.color)}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{agent.name}</div>
                          <div className="text-xs text-muted-foreground">{config?.description}</div>
                        </div>
                      </div>
                      {getAgentStatusIcon(agent.status)}
                    </div>
                    
                    {agent.reasoning && (
                      <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                        💭 {agent.reasoning.slice(0, 100)}...
                      </div>
                    )}
                    
                    {agent.lastAction && (
                      <div className="text-xs text-muted-foreground mt-1">
                        ⚡ {agent.lastAction}
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Coordination Chat */}
          <Card className="bg-card/50 border-border backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                Agent Coordination Chat
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-96 overflow-y-auto space-y-3">
              {coordinationLogs.map((step) => {
                const config = AGENT_CONFIGS[step.agent as keyof typeof AGENT_CONFIGS];
                const Icon = config?.icon || Activity;
                
                return (
                  <div key={step.stepNumber} className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", config?.color)}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-foreground text-sm">
                          {config?.name || step.agent}
                        </span>
                        <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                          Step {step.stepNumber}
                        </Badge>
                      </div>
                      <div className="text-muted-foreground text-sm">
                        {step.reasoning}
                      </div>
                      {step.nextAgentRecommendation && (
                        <div className="text-xs text-blue-600 dark:text-blue-400 mt-2 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          Next: {step.nextAgentRecommendation.reason}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {streamingStep && (
                <div className="flex gap-3 p-3 bg-muted/50 rounded-lg border-2 border-blue-500 animate-pulse">
                  <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  </div>
                  <div className="flex-1">
                    <div className="text-blue-600 dark:text-blue-400 text-sm font-medium">Processing...</div>
                    <div className="text-muted-foreground text-xs">Agent analyzing data...</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Analysis Results */}
        <div className="space-y-6">
          {/* Strategic Analysis */}
          <Card className="bg-card/50 border-border backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Brain className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Strategic Intelligence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                ref={analysisRef}
                className="prose prose-sm max-w-none dark:prose-invert"
              >
                {finalAnalysis ? (
                  <ReactMarkdown
                    components={{
                      h1: ({ children }) => <h1 className="text-xl font-bold text-foreground mb-3">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-lg font-semibold text-foreground mb-2 mt-4">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-base font-semibold text-foreground mb-1 mt-3">{children}</h3>,
                      p: ({ children }) => <p className="text-foreground leading-relaxed mb-2">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc list-inside text-foreground space-y-1 mb-2 ml-2">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal list-inside text-foreground space-y-1 mb-2 ml-2">{children}</ol>,
                      li: ({ children }) => <li className="text-foreground text-sm">{children}</li>,
                      strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                      em: ({ children }) => <em className="italic text-muted-foreground">{children}</em>,
                      code: ({ children }) => <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono text-foreground">{children}</code>,
                      blockquote: ({ children }) => <blockquote className="border-l-4 border-blue-500 pl-3 italic text-muted-foreground my-2">{children}</blockquote>,
                    }}
                  >
                    {finalAnalysis}
                  </ReactMarkdown>
                ) : (
                  <div className="text-muted-foreground italic text-center py-8">
                    Strategic analysis will appear here after agent coordination...
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          {finalAnalysis && (
            <Card className="bg-card/50 border-border backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-foreground text-sm">🎯 Suggested Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start text-left border-border text-foreground hover:bg-muted"
                  onClick={() => router.push(`/digital-twin${nodeId ? `?twinId=${nodeId}` : ''}`)}
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  View Digital Twin for {nodeId || 'Network'}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start text-left border-border text-foreground hover:bg-muted"
                >
                  <Activity className="w-4 h-4 mr-2" />
                  Run Advanced Simulation
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start text-left border-border text-foreground hover:bg-muted"
                >
                  <Target className="w-4 h-4 mr-2" />
                  Generate Action Plan
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
