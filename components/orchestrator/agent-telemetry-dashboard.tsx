'use client'

import React, { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Play, 
  Square, 
  Activity, 
  Brain, 
  Zap, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Target,
  BarChart3,
  Shield,
  History,
  Trash2,
  Link,
  ArrowRight,
  RefreshCw
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface CoordinationStep {
  stepNumber: number
  agent: string
  action: string
  reasoning: string
  input: any
  output: any
  processingTime: number
  nextAgentRecommendation?: {
    agent: string
    reason: string
  }
}

interface OrchestratorResponse {
  analysis: string
  coordinationLogs: CoordinationStep[]
  totalSteps: number
  agentsInvolved: string[]
  processingTime: number
  workflowEfficiency: number
  finalRecommendations?: string[]
}

interface SupplyChainNode {
  id: string
  name: string
  type: string
  location?: string
  risk_level?: number
}

interface AgentTelemetryProps {
  initialQuery?: string
  initialNodeId?: string
  userId?: string
  supplyChainId?: string
  availableNodes?: SupplyChainNode[]
}

export default function AgentTelemetryDashboard({ 
  initialQuery = "", 
  initialNodeId = "",
  userId = "demo-user",
  supplyChainId,
  availableNodes = []
}: AgentTelemetryProps) {
  const [query, setQuery] = useState(initialQuery)
  const [nodeId, setNodeId] = useState(initialNodeId)
  const [depth, setDepth] = useState('comprehensive')
  const [isRunning, setIsRunning] = useState(false)
  const [response, setResponse] = useState<OrchestratorResponse | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [streamingStep, setStreamingStep] = useState<string>("")
  const [sessionHistory, setSessionHistory] = useState<OrchestratorResponse[]>([])
  const [isChainedQuery, setIsChainedQuery] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [response, streamingStep, sessionHistory])

  // Load persisted state on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedResponse = sessionStorage.getItem('orchestrator-response')
      const savedHistory = sessionStorage.getItem('orchestrator-history')
      const savedQuery = sessionStorage.getItem('orchestrator-query')
      const savedNodeId = sessionStorage.getItem('orchestrator-nodeId')
      
      let restored = false
      
      if (savedResponse) {
        try {
          setResponse(JSON.parse(savedResponse))
          restored = true
        } catch (e) {
          console.error('Failed to parse saved response:', e)
        }
      }
      
      if (savedHistory) {
        try {
          const history = JSON.parse(savedHistory)
          setSessionHistory(history)
          if (history.length > 0) restored = true
        } catch (e) {
          console.error('Failed to parse saved history:', e)
        }
      }
      
      if (savedQuery && !initialQuery) {
        setQuery(savedQuery)
        const isChained = sessionStorage.getItem('orchestrator-chained') === 'true'
        setIsChainedQuery(isChained)
      }
      
      if (savedNodeId && !initialNodeId) {
        setNodeId(savedNodeId)
      }
      
      // Show restoration notification
      if (restored) {
        setTimeout(() => {
          toast({
            title: "Session Restored",
            description: "Previous orchestration results have been restored",
          })
        }, 1000)
      }
    }
  }, [initialQuery, initialNodeId])

  // Auto-populate demo data on mount
  useEffect(() => {
    if (!initialQuery && !query) {
      setQuery("Analyze supply chain risks for our electronics manufacturing operations")
    }
    if (!initialNodeId && !nodeId) {
      setNodeId("all") // Default to "all" nodes instead of a specific node
    }
  }, [initialQuery, initialNodeId, query, nodeId])

  const executeOrchestration = async () => {
    if (!query.trim()) {
      toast({
        title: "Mission Parameter Missing",
        description: "Please specify your intelligence request",
        variant: "destructive",
      })
      return
    }

    setIsRunning(true)
    setError(null)
    setResponse(null)
    setCurrentStep(0)
    setStreamingStep("🎯 Initiating multi-agent coordination...")

    try {
      const payload = {
        query: query.trim(),
        nodeId: nodeId.trim() === 'all' ? undefined : nodeId.trim() || undefined,
        userId: userId,
        supplyChainId: supplyChainId,
        preferences: {
          depth: depth,
          speed: 'balanced'
        }
      }

      console.log('🚀 Launching orchestration with payload:', payload)

      const res = await fetch('/api/agent/orchestrator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || `Server error: ${res.status}`)
      }

      const data: OrchestratorResponse = await res.json()
      
      console.log('✅ Orchestration complete:', data)
      
      setResponse(data)
      setStreamingStep("")
      
      // Save to sessionStorage for persistence
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('orchestrator-response', JSON.stringify(data))
        sessionStorage.setItem('orchestrator-query', query.trim())
        sessionStorage.setItem('orchestrator-nodeId', nodeId)
        
        // Add to session history
        const newHistory = [...sessionHistory, data]
        setSessionHistory(newHistory)
        sessionStorage.setItem('orchestrator-history', JSON.stringify(newHistory))
      }
      
      toast({
        title: "🎯 Mission Accomplished",
        description: `Multi-agent analysis complete in ${(data.processingTime / 1000).toFixed(1)}s`,
      })

    } catch (err) {
      console.error('❌ Orchestration failed:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      setStreamingStep("")
      
      toast({
        title: "⚠️ Mission Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsRunning(false)
    }
  }

  const stopOrchestration = () => {
    setIsRunning(false)
    setStreamingStep("")
    toast({
      title: "Mission Aborted",
      description: "Orchestration stopped by user",
      variant: "destructive",
    })
  }

  const clearSession = () => {
    setResponse(null)
    setSessionHistory([])
    setError(null)
    setIsChainedQuery(false)
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('orchestrator-response')
      sessionStorage.removeItem('orchestrator-history')
      sessionStorage.removeItem('orchestrator-query')
      sessionStorage.removeItem('orchestrator-nodeId')
      sessionStorage.removeItem('orchestrator-chained')
    }
    toast({
      title: "Session Cleared",
      description: "All orchestration data has been cleared",
    })
  }

  const chainFromRecommendation = (recommendation: string) => {
    setQuery(recommendation)
    setIsChainedQuery(true)
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('orchestrator-query', recommendation)
      sessionStorage.setItem('orchestrator-chained', 'true')
    }
    toast({
      title: "Chaining Analysis",
      description: "New query set based on recommendation",
    })
  }

  const chainFromStep = (step: CoordinationStep) => {
    const chainQuery = `Continue analysis from ${step.agent}: ${step.reasoning.slice(0, 100)}...`
    setQuery(chainQuery)
    setIsChainedQuery(true)
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('orchestrator-query', chainQuery)
      sessionStorage.setItem('orchestrator-chained', 'true')
    }
    toast({
      title: "Chaining from Step",
      description: `Continuing from ${step.agent} analysis`,
    })
  }

  const getAgentIcon = (agent: string) => {
    switch (agent.toLowerCase()) {
      case 'gatherintelligence': return <Activity className="h-4 w-4" />
      case 'generateforecast': return <BarChart3 className="h-4 w-4" />
      case 'generatescenarios': return <Brain className="h-4 w-4" />
      case 'assessimpact': return <AlertTriangle className="h-4 w-4" />
      case 'generatestrategy': return <Shield className="h-4 w-4" />
      default: return <Zap className="h-4 w-4" />
    }
  }

  const getAgentDisplayName = (agent: string) => {
    switch (agent.toLowerCase()) {
      case 'gatherintelligence': return 'Intelligence Agent'
      case 'generateforecast': return 'Forecast Agent'
      case 'generatescenarios': return 'Scenario Agent'
      case 'assessimpact': return 'Impact Agent'
      case 'generatestrategy': return 'Strategy Agent'
      default: return agent
    }
  }

  const getStepStatus = (step: CoordinationStep) => {
    if (step.output && step.output[0]) {
      return { status: 'success', color: 'bg-green-500' }
    }
    return { status: 'warning', color: 'bg-yellow-500' }
  }

  return (
    <div className="min-h-full flex-1 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-950 dark:via-slate-900/80 dark:to-slate-800/60 text-slate-900 dark:text-white">
      <div className="max-w-7xl mx-auto space-y-6 p-4 md:p-6">{/* Responsive padding */}
        
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            🎯 SupplyChain AI Command Center
          </h1>
          <div className="flex items-center justify-center gap-4">
            <p className="text-lg text-blue-600 dark:text-blue-300/90">
              Elite Multi-Agent Coordination System • Defense-Grade Intelligence
            </p>
            {(response || sessionHistory.length > 0) && (
              <Badge variant="outline" className="text-amber-600 dark:text-amber-300 border-amber-500/30 bg-amber-100/30 dark:bg-amber-900/20">
                <History className="h-3 w-3 mr-1" />
                Session Active
              </Badge>
            )}
          </div>
        </div>

        {/* Mission Control Panel */}
        <Card className="border-blue-500/30 bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-600 dark:text-blue-300">
              <Target className="h-5 w-5" />
              Mission Parameters
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-300">
              Configure your supply chain intelligence operation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="query" className="text-blue-600 dark:text-blue-200">Intelligence Request</Label>
                  {isChainedQuery && (
                    <Badge variant="outline" className="text-orange-600 dark:text-orange-300 border-orange-500/30 bg-orange-100/30 dark:bg-orange-900/20 text-xs">
                      <Link className="h-3 w-3 mr-1" />
                      Chained Query
                    </Badge>
                  )}
                </div>
                <Textarea
                  id="query"
                  placeholder="Analyze supply chain risks for our electronics manufacturing..."
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value)
                    setIsChainedQuery(false)
                    if (typeof window !== 'undefined') {
                      sessionStorage.removeItem('orchestrator-chained')
                    }
                  }}
                  className="bg-white/80 dark:bg-slate-800/50 border-blue-500/30 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400"
                  rows={3}
                />
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nodeId" className="text-blue-600 dark:text-blue-200">Target Node (Optional)</Label>
                  <Select value={nodeId} onValueChange={setNodeId}>
                    <SelectTrigger className="bg-white/80 dark:bg-slate-800/50 border-blue-500/30 text-slate-900 dark:text-white">
                      <SelectValue placeholder="Select target node..." />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-slate-800 border-blue-500/30">
                      <SelectItem value="all">
                        <span className="text-slate-500 dark:text-slate-400">All Nodes</span>
                      </SelectItem>
                      {availableNodes.map((node, index) => (
                        <SelectItem key={node.id || `node-${index}`} value={node.id}>
                          <div className="flex items-center gap-2">
                            <Zap className="h-3 w-3" />
                            <span>{node.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {node.type}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="depth" className="text-blue-600 dark:text-blue-200">Analysis Depth</Label>
                  <Select value={depth} onValueChange={setDepth}>
                    <SelectTrigger className="bg-white/80 dark:bg-slate-800/50 border-blue-500/30 text-slate-900 dark:text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-slate-800 border-blue-500/30">
                      <SelectItem value="basic">Basic (3 steps)</SelectItem>
                      <SelectItem value="standard">Standard (6 steps)</SelectItem>
                      <SelectItem value="comprehensive">Comprehensive (8 steps)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button
                onClick={executeOrchestration}
                disabled={isRunning || !query.trim()}
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white flex items-center gap-2 disabled:opacity-50"
              >
                {isRunning ? (
                  <>
                    <Square className="h-4 w-4" />
                    Coordinating Agents...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Launch Mission
                  </>
                )}
              </Button>
              
              {isRunning && (
                <Button
                  onClick={stopOrchestration}
                  variant="destructive"
                  className="flex items-center gap-2"
                >
                  <Square className="h-4 w-4" />
                  Abort
                </Button>
              )}
              
              {(response || sessionHistory.length > 0) && (
                <Button
                  onClick={clearSession}
                  variant="outline"
                  className="bg-white/80 dark:bg-slate-800/50 border-slate-300 dark:border-slate-600/30 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear Session
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Session History Panel */}
        {sessionHistory.length > 0 && (
          <Card className="border-amber-500/30 bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-300">
                <History className="h-5 w-5" />
                Session History ({sessionHistory.length} analyses)
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-300">
                Previous orchestration results from this session
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800 pr-2">
                {sessionHistory.map((historyItem, index) => (
                  <div key={index} className="p-3 bg-slate-100/50 dark:bg-slate-800/30 rounded-lg border border-amber-500/20">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-amber-600 dark:text-amber-300 border-amber-500/30 text-xs">
                            Analysis #{index + 1}
                          </Badge>
                          <Badge variant="outline" className="text-slate-600 dark:text-slate-300 border-slate-500/30 text-xs">
                            {historyItem.totalSteps} steps
                          </Badge>
                          <Badge variant="outline" className="text-slate-600 dark:text-slate-300 border-slate-500/30 text-xs">
                            {(historyItem.processingTime / 1000).toFixed(1)}s
                          </Badge>
                        </div>
                        <div className="text-slate-700 dark:text-slate-200 text-sm line-clamp-2 max-h-12 overflow-hidden">
                          {historyItem.analysis.split('\n')[0].slice(0, 100)}...
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setResponse(historyItem)
                          toast({
                            title: "Analysis Restored",
                            description: `Showing analysis #${index + 1}`,
                          })
                        }}
                        className="bg-amber-100/50 dark:bg-amber-900/20 border-amber-500/30 text-amber-600 dark:text-amber-300 hover:bg-amber-200/50 dark:hover:bg-amber-900/30 flex items-center gap-1 shrink-0"
                      >
                        <RefreshCw className="h-3 w-3" />
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Live Agent Telemetry */}
        {(isRunning || response || error) && (
          <Card className="border-cyan-500/30 bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-cyan-600 dark:text-cyan-300">
                <Activity className="h-5 w-5" />
                Live Agent Telemetry
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800 pr-2">
                
                {/* Streaming Status */}
                {streamingStep && (
                  <div className="p-3 bg-blue-100/50 dark:bg-blue-900/30 rounded-lg border border-blue-500/30">
                    <div className="flex items-center gap-2">
                      <div className="animate-pulse h-2 w-2 bg-blue-500 dark:bg-blue-400 rounded-full"></div>
                      <span className="text-blue-700 dark:text-blue-200">{streamingStep}</span>
                    </div>
                  </div>
                )}

                {/* Agent Steps */}
                {response?.coordinationLogs.map((step, index) => {
                  const { status, color } = getStepStatus(step)
                  return (
                    <div key={index} className="p-4 bg-slate-100/50 dark:bg-slate-800/50 rounded-lg border border-slate-300/30 dark:border-slate-600/30">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full ${color.replace('bg-', 'bg-opacity-20 bg-')}`}>
                          {getAgentIcon(step.agent)}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-cyan-600 dark:text-cyan-300 border-cyan-500/30">
                              Step {step.stepNumber}
                            </Badge>
                            <span className="font-medium text-slate-900 dark:text-white">
                              {getAgentDisplayName(step.agent)}
                            </span>
                            {status === 'success' ? (
                              <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-yellow-500 dark:text-yellow-400" />
                            )}
                          </div>
                          <div className="text-slate-700 dark:text-slate-200 text-sm leading-relaxed max-h-32 overflow-y-auto">
                            {step.reasoning}
                          </div>
                          {step.nextAgentRecommendation && (
                            <div className="mt-2 p-2 bg-blue-100/50 dark:bg-blue-900/20 rounded border border-blue-500/20">
                              <span className="text-blue-700 dark:text-blue-300 text-xs">
                                Next: {getAgentDisplayName(step.nextAgentRecommendation.agent)} - {step.nextAgentRecommendation.reason}
                              </span>
                            </div>
                          )}
                          <div className="mt-3 flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => chainFromStep(step)}
                              className="bg-white/80 dark:bg-slate-700/50 border-slate-300 dark:border-slate-600/30 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600/50 flex items-center gap-1"
                            >
                              <Link className="h-3 w-3" />
                              Chain from Step
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}

                {/* Error Display */}
                {error && (
                  <div className="p-4 bg-red-100/50 dark:bg-red-900/30 rounded-lg border border-red-500/30">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-500 dark:text-red-400" />
                      <span className="font-medium text-red-700 dark:text-red-300">Mission Failed</span>
                    </div>
                    <p className="text-red-600 dark:text-red-200 mt-2">{error}</p>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mission Results */}
        {response && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">{/* Changed from lg to xl for better breakpoint */}
            
            {/* Mission Summary */}
            <Card className="xl:col-span-2 border-green-500/30 bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm">{/* Updated column span */}
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-300">
                  <CheckCircle className="h-5 w-5" />
                  Mission Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-slate dark:prose-invert max-w-none">
                  <div className="bg-slate-100/50 dark:bg-slate-800/50 p-6 rounded-lg border border-slate-300/30 dark:border-slate-600/30 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
                    <div className="text-slate-900 dark:text-white leading-relaxed [&>h1]:text-2xl [&>h1]:text-blue-600 dark:[&>h1]:text-blue-300 [&>h1]:font-bold [&>h1]:mb-4 
                                [&>h2]:text-xl [&>h2]:text-cyan-600 dark:[&>h2]:text-cyan-300 [&>h2]:font-semibold [&>h2]:mb-3 [&>h2]:mt-6
                                [&>h3]:text-lg [&>h3]:text-green-600 dark:[&>h3]:text-green-300 [&>h3]:font-medium [&>h3]:mb-2 [&>h3]:mt-4
                                [&>p]:mb-4 [&>p]:text-slate-800 dark:[&>p]:text-slate-100 [&>p]:leading-7
                                [&>ul]:mb-4 [&>ul]:pl-6 [&>ul]:text-slate-800 dark:[&>ul]:text-slate-100
                                [&>ol]:mb-4 [&>ol]:pl-6 [&>ol]:text-slate-800 dark:[&>ol]:text-slate-100
                                [&>li]:mb-2 [&>li]:text-slate-800 dark:[&>li]:text-slate-100
                                [&>blockquote]:border-l-4 [&>blockquote]:border-blue-500 dark:[&>blockquote]:border-blue-400 [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:text-blue-700 dark:[&>blockquote]:text-blue-200
                                [&>code]:bg-slate-200 dark:[&>code]:bg-slate-700 [&>code]:px-2 [&>code]:py-1 [&>code]:rounded [&>code]:text-cyan-700 dark:[&>code]:text-cyan-300
                                [&>pre]:bg-slate-200 dark:[&>pre]:bg-slate-800 [&>pre]:p-4 [&>pre]:rounded-lg [&>pre]:border [&>pre]:border-slate-300/30 dark:[&>pre]:border-slate-600/30
                                [&_strong]:text-yellow-700 dark:[&_strong]:text-yellow-300 [&_strong]:font-semibold
                                [&_em]:text-blue-700 dark:[&_em]:text-blue-200 [&_em]:italic">
                      <ReactMarkdown 
                        components={{
                          h1: ({ children }) => <h1 className="text-2xl text-blue-600 dark:text-blue-300 font-bold mb-4">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-xl text-cyan-600 dark:text-cyan-300 font-semibold mb-3 mt-6">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-lg text-green-600 dark:text-green-300 font-medium mb-2 mt-4">{children}</h3>,
                          p: ({ children }) => <p className="mb-4 text-slate-800 dark:text-slate-100 leading-7">{children}</p>,
                          ul: ({ children }) => <ul className="mb-4 pl-6 text-slate-800 dark:text-slate-100 list-disc">{children}</ul>,
                          ol: ({ children }) => <ol className="mb-4 pl-6 text-slate-800 dark:text-slate-100 list-decimal">{children}</ol>,
                          strong: ({ children }) => <strong className="text-yellow-700 dark:text-yellow-300 font-semibold">{children}</strong>,
                          em: ({ children }) => <em className="text-blue-700 dark:text-blue-200 italic">{children}</em>,
                          code: ({ children }) => <code className="bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded text-cyan-700 dark:text-cyan-300">{children}</code>,
                          blockquote: ({ children }) => <blockquote className="border-l-4 border-blue-500 dark:border-blue-400 pl-4 italic text-blue-700 dark:text-blue-200">{children}</blockquote>
                        }}
                      >
                        {response.analysis}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
                
                {response.finalRecommendations && response.finalRecommendations.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-medium text-green-600 dark:text-green-300 mb-3 flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Strategic Recommendations
                    </h4>
                    <ul className="space-y-3">
                      {response.finalRecommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-3 p-3 bg-slate-100/50 dark:bg-slate-800/30 rounded-lg border border-green-500/20">
                          <Target className="h-4 w-4 text-green-500 dark:text-green-400 mt-1 flex-shrink-0" />
                          <div className="flex-1 space-y-2">
                            <span className="text-slate-800 dark:text-slate-100 text-sm leading-relaxed">{rec}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => chainFromRecommendation(rec)}
                              className="bg-green-100/50 dark:bg-green-900/20 border-green-500/30 text-green-600 dark:text-green-300 hover:bg-green-200/50 dark:hover:bg-green-900/30 flex items-center gap-1"
                            >
                              <ArrowRight className="h-3 w-3" />
                              Chain Analysis
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Mission Metrics */}
            <Card className="border-purple-500/30 bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-600 dark:text-purple-300">
                  <BarChart3 className="h-5 w-5" />
                  Mission Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-300">Processing Time</span>
                    <Badge variant="outline" className="text-purple-600 dark:text-purple-300 border-purple-500/30">
                      {(response.processingTime / 1000).toFixed(1)}s
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-300">Workflow Efficiency</span>
                    <Badge variant="outline" className="text-purple-600 dark:text-purple-300 border-purple-500/30">
                      {Math.round(response.workflowEfficiency * 100)}%
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-300">Total Steps</span>
                    <Badge variant="outline" className="text-purple-600 dark:text-purple-300 border-purple-500/30">
                      {response.totalSteps}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-3">
                  <span className="text-slate-600 dark:text-slate-300 text-sm font-medium">Agents Deployed</span>
                  <div className="flex flex-wrap gap-2">
                    {response.agentsInvolved.map((agent, index) => (
                      <Badge key={index} className="bg-purple-100/50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-200 border-purple-500/30 px-3 py-1">
                        <div className="flex items-center gap-2">
                          {getAgentIcon(agent)}
                          {getAgentDisplayName(agent)}
                        </div>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-300/30 dark:border-slate-600/30">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-600 dark:text-slate-300 text-sm font-medium">Mission Status</span>
                    <span className="text-green-600 dark:text-green-400 text-sm font-semibold">COMPLETE ✓</span>
                  </div>
                  <Progress 
                    value={100} 
                    className="bg-slate-200 dark:bg-slate-700 h-2 [&>div]:bg-gradient-to-r [&>div]:from-green-500 [&>div]:to-cyan-500"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
