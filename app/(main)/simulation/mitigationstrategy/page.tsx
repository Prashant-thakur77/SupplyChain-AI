"use client"

import React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Shield, Target, Clock, TrendingUp, CheckCircle, AlertCircle, RefreshCw, Sparkles, Eye, Activity, FileCheck } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState, useEffect, useMemo, useRef } from "react"
import { ImplementationRoadmapPanel } from "@/components/simulation/ImplementationRoadmapPanel"
import { FinalizeStrategyPanel } from "@/components/simulation/FinalizeStrategyPanel"
import { toast } from 'sonner'

// API Types based on the strategy agent response
interface ApiMitigationStrategy {
  id: number
  title: string
  description: string
  priority: 'Critical' | 'High' | 'Medium' | 'Low' | 'Strategic'
  timeframe: string
  costEstimate: string
  impactReduction: string
  status: 'ready' | 'planning' | 'recommended' | 'in-progress' | 'completed'
  category: 'immediate' | 'shortTerm' | 'longTerm'
  feasibility: 'HIGH' | 'MEDIUM' | 'LOW'
  dependencies: string[]
  riskFactors: string[]
  successMetrics: string[]
  resourceRequirements: {
    personnel: number
    equipment: string[]
    partnerships: string[]
  }
}

interface ApiStrategyResponse {
  immediate: ApiMitigationStrategy[]
  shortTerm: ApiMitigationStrategy[]
  longTerm: ApiMitigationStrategy[]
  riskMitigationMetrics: {
    currentRisk: number
    targetRisk: number
    costToImplement: string
    expectedROI: string
    paybackPeriod: string
    riskReduction: string
  }
  keyInsights: string[]
  marketIntelligence: string[]
  bestPractices: string[]
  contingencyPlans: string[]
  processingTime?: number
  enhanced?: boolean
  memoryContextAvailable?: boolean
  marketIntelligenceGathered?: boolean
}

// Legacy types for fallback
interface MitigationStrategy {
  id: number
  title: string
  description: string
  priority: string
  timeframe: string
  costEstimate: string
  impactReduction: string
  status: string
}

interface MitigationStrategies {
  immediate: MitigationStrategy[]
  shortTerm: MitigationStrategy[]
  longTerm: MitigationStrategy[]
}

interface RiskMitigationMetrics {
  currentRisk: number
  targetRisk: number
  costToImplement: string
  expectedROI: string
  paybackPeriod: string
  riskReduction: string
}

interface SelectedStrategySummary {
  immediate: ApiMitigationStrategy[]
  shortTerm: ApiMitigationStrategy[]
  longTerm: ApiMitigationStrategy[]
  totalCost: string
  totalImpact: string
  timelineSpan: string
  riskReduction: string
}

interface FinalizeData {
  approvedStrategies: number[]
  implementationNotes: string
  priorityAdjustments: { strategyId: number; newPriority: string }[]
  stakeholderApproval: boolean
  budgetConfirmed: boolean
  resourcesAllocated: boolean
  timelineAccepted: boolean
}

// Default fallback data
const DEFAULT_MITIGATION_STRATEGIES = {
  immediate: [
    {
      id: 1,
      title: "Activate Alternative Shipping Routes",
      description: "Immediately redirect shipments through Hong Kong and Ningbo ports",
      priority: "Critical",
      timeframe: "0-24 hours",
      costEstimate: "$120K",
      impactReduction: "25%",
      status: "ready"
    }
  ],
  shortTerm: [
    {
      id: 2,
      title: "Expedited Air Freight",
      description: "Charter air freight for critical components and high-priority orders",
      priority: "High",
      timeframe: "1-3 days",
      costEstimate: "$380K",
      impactReduction: "30%",
      status: "planning"
    }
  ],
  longTerm: [
    {
      id: 3,
      title: "Supply Chain Diversification",
      description: "Establish alternative supplier relationships in Southeast Asia",
      priority: "Strategic",
      timeframe: "30-90 days",
      costEstimate: "$2.1M",
      impactReduction: "60%",
      status: "recommended"
    }
  ]
}

const DEFAULT_RISK_MITIGATION_METRICS = {
  currentRisk: 85,
  targetRisk: 35,
  costToImplement: "$8.1M",
  expectedROI: "2.4x",
  paybackPeriod: "18 months",
  riskReduction: "50%"
}

// API function to fetch strategy data
async function fetchStrategyData(simulationId: string): Promise<ApiStrategyResponse | null> {
  try {
    console.log(`🔍 Fetching strategy data for simulation: ${simulationId}`)
    
    const response = await fetch(`/api/agent/strategy?simulationId=${simulationId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    
    if (result.success && result.data) {
      console.log('✅ Successfully fetched strategy data')
      return result.data
    } else {
      throw new Error(result.error || 'Failed to fetch strategy data')
    }
  } catch (error) {
    console.error('❌ Error fetching strategy data:', error)
    return null
  }
}

// Enhanced Strategy Card Component
function StrategyCard({ strategy, index }: { strategy: ApiMitigationStrategy | MitigationStrategy, index: number }) {
  // Helper function to check if strategy is API type
  const isApiStrategy = (s: any): s is ApiMitigationStrategy => {
    return s.feasibility !== undefined && s.dependencies !== undefined;
  }

  // Convert legacy strategy to API format for display
  const apiStrategy: ApiMitigationStrategy = isApiStrategy(strategy) ? strategy : {
    id: strategy.id,
    title: strategy.title,
    description: strategy.description,
    priority: strategy.priority as any,
    timeframe: strategy.timeframe,
    costEstimate: strategy.costEstimate,
    impactReduction: strategy.impactReduction,
    status: strategy.status as any,
    category: 'immediate' as any,
    feasibility: 'HIGH' as any,
    dependencies: [],
    riskFactors: [],
    successMetrics: [],
    resourceRequirements: {
      personnel: 2,
      equipment: [],
      partnerships: []
    }
  }
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critical":
        return "bg-black text-white dark:bg-white dark:text-black border-transparent"
      case "High":
        return "bg-gray-800 text-white dark:bg-gray-200 dark:text-black border-transparent"
      case "Medium":
        return "bg-gray-600 text-white dark:bg-gray-400 dark:text-black border-transparent"
      case "Strategic":
        return "bg-gray-500 text-white dark:bg-gray-400 dark:text-black border-transparent"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700"
    }
  }

  const getFeasibilityColor = (feasibility: string) => {
    switch (feasibility) {
      case "HIGH":
        return "bg-black text-white dark:bg-white dark:text-black border-transparent"
      case "MEDIUM":
        return "bg-gray-600 text-white dark:bg-gray-400 dark:text-black border-transparent"
      case "LOW":
        return "bg-gray-400 text-white dark:bg-gray-600 dark:text-black border-transparent"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ready":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "planning":
        return <Clock className="h-4 w-4 text-orange-500" />
      case "recommended":
        return <AlertCircle className="h-4 w-4 text-blue-500" />
      case "in-progress":
        return <Activity className="h-4 w-4 text-purple-500" />
      default:
        return null
    }
  }

  const [expanded, setExpanded] = useState(false)

  return (
    <Card className="p-4 sm:p-6 hover:shadow-md transition-all duration-300 group border border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 text-black dark:text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 border border-gray-200 dark:border-gray-700">
            {index + 1}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-base sm:text-lg break-words line-clamp-2 text-black dark:text-white">{strategy.title}</h3>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">{strategy.timeframe}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          <Badge className={`text-xs font-medium ${getPriorityColor(strategy.priority)}`}>
            {strategy.priority}
          </Badge>
          {getStatusIcon(strategy.status)}
        </div>
      </div>
      
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 leading-relaxed line-clamp-3">
        {strategy.description}
      </p>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-sm mb-4">
        <div className="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg p-3">
          <p className="font-medium text-gray-500 text-xs mb-1">Cost</p>
          <p className="font-semibold text-black dark:text-white">{strategy.costEstimate}</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg p-3">
          <p className="font-medium text-gray-500 text-xs mb-1">Impact Reduction</p>
          <p className="font-semibold text-black dark:text-white">{strategy.impactReduction}</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg p-3">
          <p className="font-medium text-gray-500 text-xs mb-1">Feasibility</p>
          <Badge className={`text-xs font-medium ${getFeasibilityColor(apiStrategy.feasibility)}`}>
            {apiStrategy.feasibility}
          </Badge>
        </div>
      </div>

      {/* Expandable Details Section */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setExpanded(!expanded)}
        className="w-full mb-2 text-xs font-medium"
      >
        {expanded ? 'Hide Details' : 'Show Details'}
        <Eye className="h-3 w-3 ml-2" />
      </Button>

      {expanded && (
        <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-800">
          {apiStrategy.dependencies.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-800">
              <p className="font-medium text-sm mb-2 text-black dark:text-white">Dependencies:</p>
              <ul className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                {apiStrategy.dependencies.map((dep: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-gray-500 rounded-full mt-1.5 flex-shrink-0"></span>
                    {dep}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {apiStrategy.riskFactors.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-800">
              <p className="font-medium text-sm mb-2 text-black dark:text-white">Risk Factors:</p>
              <ul className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                {apiStrategy.riskFactors.map((risk: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <AlertCircle className="w-3 h-3 text-gray-500 mt-0.5 flex-shrink-0" />
                    {risk}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {apiStrategy.successMetrics.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-800">
              <p className="font-medium text-sm mb-2 text-black dark:text-white">Success Metrics:</p>
              <ul className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                {apiStrategy.successMetrics.map((metric: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Target className="w-3 h-3 text-gray-500 mt-0.5 flex-shrink-0" />
                    {metric}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-800">
            <p className="font-medium text-sm mb-2 text-black dark:text-white">Resource Requirements:</p>
            <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
              <p><span className="font-medium text-black dark:text-white">Personnel:</span> {apiStrategy.resourceRequirements.personnel} people</p>
              {apiStrategy.resourceRequirements.equipment.length > 0 && (
                <p><span className="font-medium text-black dark:text-white">Equipment:</span> {apiStrategy.resourceRequirements.equipment.join(', ')}</p>
              )}
              {apiStrategy.resourceRequirements.partnerships.length > 0 && (
                <p><span className="font-medium text-black dark:text-white">Partnerships:</span> {apiStrategy.resourceRequirements.partnerships.join(', ')}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}

// Roadmap steps for the panel
const ROADMAP_STEPS = [
  {
    title: "Crisis Response (0-24 hours)",
    description: "Immediate containment and assessment strategies to minimize initial impact",
    color: "bg-black text-white dark:bg-white dark:text-black",
    icon: <AlertCircle className="h-6 w-6" />,
  },
  {
    title: "Recovery Operations (1-30 days)", 
    description: "Short-term stabilization and restoration measures",
    color: "bg-gray-800 text-white dark:bg-gray-200 dark:text-black",
    icon: <Clock className="h-6 w-6" />,
  },
  {
    title: "Strategic Resilience (30+ days)",
    description: "Long-term improvements and future-proofing initiatives",
    color: "bg-gray-600 text-white dark:bg-gray-400 dark:text-black", 
    icon: <Shield className="h-6 w-6" />,
  },
]

export default function MitigationStrategyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [roadmapOpen, setRoadmapOpen] = useState(false)
  const [finalizeOpen, setFinalizeOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [simulationId, setSimulationId] = useState<string | null>(null)
  const hasAutoOpenedRoadmap = useRef(false)
  
  // API State
  const [strategyData, setStrategyData] = useState<ApiStrategyResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get simulation ID from URL or localStorage
  useEffect(() => {
    const urlSimulationId = searchParams.get('id')
    const storedSimulationId = localStorage.getItem('currentSimulationId')
    
    if (urlSimulationId) {
      setSimulationId(urlSimulationId)
      localStorage.setItem('currentSimulationId', urlSimulationId)
    } else if (storedSimulationId) {
      setSimulationId(storedSimulationId)
    }
  }, [searchParams])

  // Fetch strategy data when simulation ID is available
  useEffect(() => {
    if (simulationId) {
      loadStrategyData(simulationId)
    } else {
      setIsLoading(false)
      setError('No simulation ID available')
    }
  }, [simulationId])

  const loadStrategyData = async (simId: string) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const data = await fetchStrategyData(simId)
      
      if (data) {
        setStrategyData(data)
        toast.success('Strategy data loaded successfully')
      } else {
        setError('Failed to load strategy data')
        toast.error('Failed to load strategy data')
      }
    } catch (err) {
      console.error('Error loading strategy data:', err)
      setError('Failed to load strategy data')
      toast.error('Failed to load strategy data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = async () => {
    if (!simulationId || isRefreshing) return
    
    setIsRefreshing(true)
    try {
      // Force refresh by calling POST endpoint
      const response = await fetch('/api/agent/strategy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          simulationId: simulationId,
          forceRefresh: true
        })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setStrategyData(result.data)
          toast.success('Strategy analysis refreshed successfully')
        }
      } else {
        toast.error('Failed to refresh strategy analysis')
      }
    } catch (error) {
      console.error('Error refreshing strategy data:', error)
      toast.error('Failed to refresh strategy analysis')
    } finally {
      setIsRefreshing(false)
    }
  }

  // Mobile detection effect
  React.useEffect(() => {
    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      
      // Auto-open roadmap on desktop only once
      if (!mobile && !hasAutoOpenedRoadmap.current) {
        setRoadmapOpen(true)
        hasAutoOpenedRoadmap.current = true
      }
    }
    const debouncedCheckMobile = () => {
      if (resizeTimer) clearTimeout(resizeTimer)
      resizeTimer = setTimeout(() => {
        checkMobile()
      }, 150)
    }
    checkMobile()
    window.addEventListener('resize', debouncedCheckMobile)
    return () => {
      window.removeEventListener('resize', debouncedCheckMobile)
      if (resizeTimer) clearTimeout(resizeTimer)
    }
  }, [])

  // Remove the separate auto-opening effect since it's now handled in the mobile detection effect

  const handleBackToResults = () => {
    if (simulationId) {
      router.push(`/simulation/result?id=${simulationId}`)
    } else {
      router.push("/simulation/result")
    }
  }

  // Use API data if available, otherwise fall back to defaults safely
  const currentStrategies = {
    immediate: strategyData?.immediate || DEFAULT_MITIGATION_STRATEGIES?.immediate || [],
    shortTerm: strategyData?.shortTerm || DEFAULT_MITIGATION_STRATEGIES?.shortTerm || [],
    longTerm: strategyData?.longTerm || DEFAULT_MITIGATION_STRATEGIES?.longTerm || [],
    riskMitigationMetrics: strategyData?.riskMitigationMetrics || DEFAULT_RISK_MITIGATION_METRICS || { currentRisk: 0, targetRisk: 0, expectedROI: "0x", riskReduction: "0%" },
    keyInsights: strategyData?.keyInsights || [],
    marketIntelligence: strategyData?.marketIntelligence || [],
    bestPractices: strategyData?.bestPractices || [],
    contingencyPlans: strategyData?.contingencyPlans || []
  }

  // Calculate selected strategies summary for finalize panel (memoized to prevent unnecessary recalculations)
  const strategySummary = useMemo((): SelectedStrategySummary => {
    // Convert all strategies to API format first
    const convertToApiFormat = (strategies: (ApiMitigationStrategy | MitigationStrategy)[]): ApiMitigationStrategy[] => {
      if (!Array.isArray(strategies)) return []
      return strategies.map(strategy => {
        // Check if it's already in API format
        if ('feasibility' in strategy && 'dependencies' in strategy) {
          return strategy as ApiMitigationStrategy
        }
        
        // Convert legacy strategy to API format
        const legacyStrategy = strategy as MitigationStrategy
        return {
          id: legacyStrategy.id,
          title: legacyStrategy.title,
          description: legacyStrategy.description,
          priority: legacyStrategy.priority as any,
          timeframe: legacyStrategy.timeframe,
          costEstimate: legacyStrategy.costEstimate,
          impactReduction: legacyStrategy.impactReduction,
          status: legacyStrategy.status as any,
          category: 'immediate' as any, // Default category
          feasibility: 'HIGH' as any,
          dependencies: [],
          riskFactors: [],
          successMetrics: [],
          resourceRequirements: {
            personnel: 2,
            equipment: [],
            partnerships: []
          }
        }
      })
    }

    const immediateApi = convertToApiFormat(currentStrategies.immediate)
    const shortTermApi = convertToApiFormat(currentStrategies.shortTerm)
    const longTermApi = convertToApiFormat(currentStrategies.longTerm)
    
    const allStrategies = [...immediateApi, ...shortTermApi, ...longTermApi]

    // Calculate total cost (extract numbers and sum)
    const totalCostValue = allStrategies.reduce((sum, strategy) => {
      const costMatch = strategy.costEstimate.match(/[\d.]+/)
      return sum + (costMatch ? parseFloat(costMatch[0]) : 0)
    }, 0)

    // Calculate average impact reduction
    const totalImpactValue = allStrategies.reduce((sum, strategy) => {
      const impactMatch = strategy.impactReduction.match(/[\d.]+/)
      return sum + (impactMatch ? parseFloat(impactMatch[0]) : 0)
    }, 0)

    return {
      immediate: immediateApi,
      shortTerm: shortTermApi,
      longTerm: longTermApi,
      totalCost: `$${totalCostValue.toFixed(1)}M`,
      totalImpact: `${allStrategies.length > 0 ? Math.round(totalImpactValue / allStrategies.length) : 0}%`,
      timelineSpan: "0-90 days",
      riskReduction: currentStrategies.riskMitigationMetrics.riskReduction
    }
  }, [currentStrategies])

  const handleFinalizeStrategy = async (finalizeData: FinalizeData) => {
    try {
      console.log('Finalizing strategy with data:', finalizeData)
      
      // The actual API call is handled within the FinalizeStrategyPanel
      // Here we can perform any additional client-side actions
      
      // Close the finalize panel
      setFinalizeOpen(false)
      
      // Show success message
      toast.success('Strategy has been successfully finalized and onboarded!')
      
      // Optionally redirect to a tracking/monitoring page
      // router.push(`/strategy/track/${simulationId}`)
      
    } catch (error) {
      console.error('Error in finalize handler:', error)
      toast.error('Failed to complete strategy finalization')
    }
  }

  // Loading State
  if (isLoading) {
    return (
      <div className="relative min-h-full flex-1 bg-white dark:bg-black text-black dark:text-white">
        <div className="relative z-10 p-6 px-4 sm:px-6 lg:px-10 max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center space-y-6">
              <div className="relative">
                <Activity className="h-16 w-16 animate-spin mx-auto text-black dark:text-white" />
              </div>
              <div className="space-y-2">
                <p className="text-xl font-semibold">Loading strategy analysis...</p>
                <p className="text-sm text-gray-500">Generating AI-powered mitigation strategies</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Mobile roadmap section component
  const MobileRoadmapSection = () => (
    <div className="lg:hidden">
      <Card className="p-6 border border-gray-200 dark:border-gray-800 bg-white dark:bg-black shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center border border-gray-200 dark:border-gray-700">
            <TrendingUp className="h-5 w-5 text-black dark:text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-black dark:text-white">Implementation Roadmap</h2>
            <p className="text-sm text-gray-500">Strategic execution timeline</p>
          </div>
        </div>
        
        <div className="space-y-6">
          {ROADMAP_STEPS.map((step, idx) => (
            <div key={idx} className="flex items-start gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center border border-gray-200 dark:border-gray-700 flex-shrink-0">
                <div className="text-black dark:text-white">{step.icon}</div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base mb-1 text-black dark:text-white">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-4 w-4 text-black dark:text-white" />
            <span className="text-sm font-semibold text-black dark:text-white">Total Impact</span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Complete implementation reduces supply chain risk by <span className="font-semibold">{currentStrategies.riskMitigationMetrics.riskReduction}</span> with an expected ROI of <span className="font-semibold">{currentStrategies.riskMitigationMetrics.expectedROI}</span>
          </p>
        </div>
      </Card>
    </div>
  )

  return (
    <div className="relative min-h-full flex-1 bg-white dark:bg-black text-black dark:text-white">

      {/* Roadmap Side Panel (desktop) & Drawer (mobile) */}
      <ImplementationRoadmapPanel
        steps={ROADMAP_STEPS}
        open={roadmapOpen}
        onClose={() => setRoadmapOpen(false)}
        isMobile={isMobile}
        finalizeOpen={finalizeOpen}
      />

      {/* Finalize Strategy Panel (desktop) & Drawer (mobile) */}
      <FinalizeStrategyPanel
        selectedStrategies={strategySummary}
        open={finalizeOpen}
        onClose={() => setFinalizeOpen(false)}
        onFinalize={handleFinalizeStrategy}
        isMobile={isMobile}
        simulationId={simulationId || undefined}
        roadmapOpen={roadmapOpen}
      />

      {/* Floating Roadmap Button (mobile only) */}
      <button
        className="lg:hidden fixed bottom-20 right-6 z-40 bg-white text-black border border-gray-200 dark:bg-black dark:text-white dark:border-gray-800 rounded-full shadow-lg p-4 flex items-center gap-2 transition-all duration-300"
        onClick={() => setRoadmapOpen(true)}
        aria-label="Open Implementation Roadmap"
      >
        <TrendingUp className="h-5 w-5" />
        <span className="font-semibold">Roadmap</span>
      </button>

      {/* Floating Finalize Button (mobile only) */}
      <button
        className="lg:hidden fixed bottom-6 left-6 z-40 bg-black text-white dark:bg-white dark:text-black rounded-full shadow-lg p-4 flex items-center gap-2 transition-all duration-300"
        onClick={() => setFinalizeOpen(true)}
        aria-label="Finalize Strategy"
      >
        <FileCheck className="h-5 w-5" />
        <span className="font-semibold">Finalize</span>
      </button>

      {/* Desktop Roadmap Toggle Button */}
      {!isMobile && !roadmapOpen && !finalizeOpen && (
        <button
          className="fixed top-1/2 right-4 z-40 bg-white text-black border border-gray-200 dark:bg-black dark:text-white dark:border-gray-800 rounded-full shadow-lg p-3 transition-all duration-300 transform -translate-y-1/2"
          onClick={() => setRoadmapOpen(true)}
          aria-label="Open Implementation Roadmap"
        >
          <TrendingUp className="h-5 w-5" />
        </button>
      )}

      <div className={`relative z-10 transition-all duration-300 ${
        !isMobile && roadmapOpen && finalizeOpen ? 'pr-[850px]' : 
        !isMobile && finalizeOpen ? 'pr-[450px]' :
        !isMobile && roadmapOpen ? 'pr-[400px]' : ''
      }`}>
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <Card className="p-6 sm:p-8 mb-8 border border-gray-200 dark:border-gray-800 bg-white dark:bg-black shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-4">
                <Button 
                  variant="ghost" 
                  onClick={handleBackToResults}
                  className="flex items-center gap-2 text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2"
                  aria-label="Navigate back to simulation results"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Results
                </Button>
                {strategyData?.enhanced && (
                  <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 border border-gray-200 dark:border-gray-800 flex items-center gap-2 px-3 py-1">
                    <Sparkles className="h-3 w-3" />
                    AI Enhanced
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-black dark:text-white">
                Mitigation Strategy
              </h1>
              <p className="text-gray-600 dark:text-gray-300 text-lg sm:text-xl leading-relaxed max-w-3xl">
                {strategyData ? 'AI-powered comprehensive action plan' : 'Comprehensive action plan'} to minimize disruption impact and enhance supply chain resilience
              </p>
              {error && (
                <div className="flex items-center gap-2 text-sm text-black dark:text-white bg-gray-100 dark:bg-gray-900 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-800">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <Button 
                onClick={() => setFinalizeOpen(true)}
                className="bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 shadow-sm transition-all duration-300 rounded-xl"
                aria-label="Finalize Strategy"
              >
                <FileCheck className="mr-2 h-4 w-4" />
                Finalize Strategy
              </Button>
              <Button 
                onClick={() => setRoadmapOpen(!roadmapOpen)}
                variant="outline"
                className="bg-white text-black border border-gray-200 hover:bg-gray-50 dark:bg-black dark:text-white dark:border-gray-800 dark:hover:bg-gray-900 shadow-sm transition-all duration-300 rounded-xl"
                aria-label={roadmapOpen ? "Close Implementation Roadmap" : "Open Implementation Roadmap"}
              >
                <TrendingUp className="mr-2 h-4 w-4" />
                {roadmapOpen ? 'Close Roadmap' : 'View Roadmap'}
              </Button>
              {simulationId && (
                <Button 
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  variant="outline"
                  className="bg-white text-black border border-gray-200 hover:bg-gray-50 dark:bg-black dark:text-white dark:border-gray-800 dark:hover:bg-gray-900 shadow-sm transition-all duration-300 rounded-xl"
                  aria-label="Refresh strategy analysis"
                >
                  {isRefreshing ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
                      Refreshing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Refresh
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Mobile Roadmap Section */}
        <MobileRoadmapSection />

        {/* Risk Reduction Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card className="p-4 sm:p-6 border border-gray-200 dark:border-gray-800 bg-white dark:bg-black shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Current Risk</p>
                <p className="text-xl sm:text-2xl font-bold text-black dark:text-white">{currentStrategies.riskMitigationMetrics.currentRisk}%</p>
              </div>
              <AlertCircle className="h-6 w-6 sm:h-8 sm:w-8 text-black dark:text-white" />
            </div>
          </Card>

          <Card className="p-4 sm:p-6 border border-gray-200 dark:border-gray-800 bg-white dark:bg-black shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Target Risk</p>
                <p className="text-xl sm:text-2xl font-bold text-black dark:text-white">{currentStrategies.riskMitigationMetrics.targetRisk}%</p>
              </div>
              <Target className="h-6 w-6 sm:h-8 sm:w-8 text-black dark:text-white" />
            </div>
          </Card>

          <Card className="p-4 sm:p-6 border border-gray-200 dark:border-gray-800 bg-white dark:bg-black shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Expected ROI</p>
                <p className="text-xl sm:text-2xl font-bold text-black dark:text-white">{currentStrategies.riskMitigationMetrics.expectedROI}</p>
              </div>
              <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-black dark:text-white" />
            </div>
          </Card>

          <Card className="p-4 sm:p-6 border border-gray-200 dark:border-gray-800 bg-white dark:bg-black shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Risk Reduction</p>
                <p className="text-xl sm:text-2xl font-bold text-black dark:text-white">{currentStrategies.riskMitigationMetrics.riskReduction}</p>
              </div>
              <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-black dark:text-white" />
            </div>
          </Card>
        </div>

        {/* Strategy Tabs */}
        <Tabs defaultValue="immediate" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-2">
            <TabsTrigger value="immediate" className="rounded-lg text-xs sm:text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-black dark:data-[state=active]:bg-black dark:data-[state=active]:text-white shadow-sm">
              Immediate ({currentStrategies.immediate.length})
            </TabsTrigger>
            <TabsTrigger value="shortterm" className="rounded-lg text-xs sm:text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-black dark:data-[state=active]:bg-black dark:data-[state=active]:text-white shadow-sm">
              Short-term ({currentStrategies.shortTerm.length})
            </TabsTrigger>
            <TabsTrigger value="longterm" className="rounded-lg text-xs sm:text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-black dark:data-[state=active]:bg-black dark:data-[state=active]:text-white shadow-sm">
              Long-term ({currentStrategies.longTerm.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="immediate" className="space-y-6">
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-black dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center">
                  <AlertCircle className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-black dark:text-white">Crisis Response (0-24 hours)</h2>
                  <p className="text-sm text-gray-500">Immediate actions to contain and minimize initial impact</p>
                </div>
                <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 border-gray-200 dark:border-gray-800 ml-auto">
                  {currentStrategies.immediate.length} strategies
                </Badge>
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
                {currentStrategies.immediate.map((strategy, index) => (
                  <StrategyCard key={strategy.id} strategy={strategy} index={index} />
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="shortterm" className="space-y-6">
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-gray-800 dark:bg-gray-200 text-white dark:text-black rounded-full flex items-center justify-center">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-black dark:text-white">Recovery Operations (1-30 days)</h2>
                  <p className="text-sm text-gray-500">Stabilization measures and restoration activities</p>
                </div>
                <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 border-gray-200 dark:border-gray-800 ml-auto">
                  {currentStrategies.shortTerm.length} strategies
                </Badge>
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
                {currentStrategies.shortTerm.map((strategy, index) => (
                  <StrategyCard key={strategy.id} strategy={strategy} index={index} />
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="longterm" className="space-y-6">
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-gray-600 dark:bg-gray-400 text-white dark:text-black rounded-full flex items-center justify-center">
                  <Shield className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-black dark:text-white">Strategic Resilience (30+ days)</h2>
                  <p className="text-sm text-gray-500">Long-term improvements and future-proofing initiatives</p>
                </div>
                <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 border-gray-200 dark:border-gray-800 ml-auto">
                  {currentStrategies.longTerm.length} strategies
                </Badge>
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
                {currentStrategies.longTerm.map((strategy, index) => (
                  <StrategyCard key={strategy.id} strategy={strategy} index={index} />
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Additional Insights Section - Only show if we have API data */}
        {strategyData && (currentStrategies.keyInsights.length > 0 || currentStrategies.bestPractices.length > 0) && (
          <div className="space-y-6">
            {/* Key Insights */}
            {currentStrategies.keyInsights.length > 0 && (
              <Card className="p-6 border border-gray-200 dark:border-gray-800 bg-white dark:bg-black shadow-sm">
                <CardHeader className="p-0 pb-6">
                  <CardTitle className="flex items-center gap-3 text-xl text-black dark:text-white">
                    <div className="w-8 h-8 bg-black dark:bg-white rounded-full flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-white dark:text-black" />
                    </div>
                    Key Strategic Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="grid grid-cols-1 gap-4">
                    {currentStrategies.keyInsights.map((insight, index) => (
                      <div key={index} className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800">
                        <div className="w-6 h-6 bg-gray-200 dark:bg-gray-800 text-black dark:text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {index + 1}
                        </div>
                        <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">{insight}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Best Practices */}
            {currentStrategies.bestPractices.length > 0 && (
              <Card className="p-6 border border-gray-200 dark:border-gray-800 bg-white dark:bg-black shadow-sm">
                <CardHeader className="p-0 pb-6">
                  <CardTitle className="flex items-center gap-3 text-xl text-black dark:text-white">
                    <div className="w-8 h-8 bg-black dark:bg-white rounded-full flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-white dark:text-black" />
                    </div>
                    Industry Best Practices
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentStrategies.bestPractices.map((practice, index) => (
                      <div key={index} className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800">
                        <CheckCircle className="w-4 h-4 text-black dark:text-white mt-0.5 flex-shrink-0" />
                        <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">{practice}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  )
}
