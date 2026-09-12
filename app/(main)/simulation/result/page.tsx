"use client"
import { useRouter, useSearchParams } from "next/navigation"
import { useMemo, useState, useEffect } from "react"
import { toast } from 'sonner'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ArrowLeft, 
  Eye, 
  TrendingDown, 
  TrendingUp,
  AlertTriangle, 
  DollarSign, 
  Clock, 
  Package, 
  CheckCircle,
  Sparkles,
  AlertCircle,
  Activity,
  BarChart3,
  FileText,
  Target,
  Zap
} from "lucide-react"
import NodeImpactGridWithVisualize from "@/components/simulation/node-impact-grid-with-visualize"
import { DEFAULT_SIMULATION_NODES } from "@/lib/data/simulation-nodes"
import { getSimulationById, getImpactResults, getEnhancedSimulationResults, triggerImpactAssessment } from "@/lib/api/simulation"
import type { Simulation, ImpactResult } from "@/lib/types/database"

// Types for better type safety
interface SimulationMetrics {
  totalCostImpact: string;
  averageDelay: string;
  inventoryReduction: string;
  recoveryTime: string;
  affectedNodes: number;
  criticalPath: string;
}

interface SimulationResults {
  scenarioName: string;
  scenarioType: string;
  status: string;
  completedAt: string;
  metrics: SimulationMetrics;
  keyFindings: string[];
  impactBreakdown: string[];
  riskFactors: string[];
  mitigationStrategies?: Array<{
    strategy: string;
    estimatedCost: string;
    timeToImplement: string;
    riskReduction: string;
    feasibility: 'HIGH' | 'MEDIUM' | 'LOW';
  }>;
  cascadingEffects?: Array<{
    affectedNode: string;
    impactType: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    timeline: string;
  }>;
  processingTime?: number;
  analysisDepth?: string;
  networkComplexity?: number;
  // Enhanced AI analysis properties
  networkAnalysis?: {
    totalNodes: number;
    totalEdges: number;
    networkDensity: number;
    criticalNodes: string[];
    singlePointsOfFailure: string[];
    alternativeRoutes: number;
    averageShortestPath: number;
    clusteringCoefficient: number;
  };
  confidenceScore?: number;
  monteCarloRuns?: number;
  dataQuality?: {
    completeness: number;
    consistency: number;
    recency: number;
  };
}

interface AnalysisItem {
  type: 'finding' | 'impact';
  content: string;
  index: number;
}

// Default empty simulation results structure
const EMPTY_SIMULATION_RESULTS: SimulationResults = {
  scenarioName: "No Scenario Selected",
  scenarioType: "Unknown",
  status: "pending",
  completedAt: new Date().toISOString(),
  metrics: {
    totalCostImpact: "$0",
    averageDelay: "0 days",
    inventoryReduction: "0%",
    recoveryTime: "0 days",
    affectedNodes: 0,
    criticalPath: "No path identified"
  },
  keyFindings: [],
  impactBreakdown: [],
  riskFactors: []
}

// Normalize any AI response shape to always have a valid metrics object
function normalizeResults(data: any): SimulationResults {
  if (!data) return EMPTY_SIMULATION_RESULTS
  return {
    ...EMPTY_SIMULATION_RESULTS,
    ...data,
    metrics: {
      ...EMPTY_SIMULATION_RESULTS.metrics,
      ...(data.metrics || {})
    },
    keyFindings: data.keyFindings || data.key_findings || EMPTY_SIMULATION_RESULTS.keyFindings,
    impactBreakdown: data.impactBreakdown || data.impact_breakdown || EMPTY_SIMULATION_RESULTS.impactBreakdown,
    riskFactors: data.riskFactors || data.risk_factors || EMPTY_SIMULATION_RESULTS.riskFactors,
  }
}

// Utility function to transform database records to UI format
function transformSimulationData(
  simulation: Simulation,
  impactResults: ImpactResult[]
): SimulationResults {
  // Create a map of impact results by metric name for easy lookup
  const impactMap = new Map(
    impactResults.map(result => [result.metric_name, result])
  )

  // Helper function to get metric value with unit or default
  const getMetricValue = (metricName: string, defaultValue: string, unit = ''): string => {
    const result = impactMap.get(metricName)
    if (result) {
      return `${result.metric_value}${unit || result.measurement_unit}`
    }
    return defaultValue
  }

  // Extract key findings and impact breakdown from result_summary if available
  const resultSummary = simulation.result_summary || {}
  const keyFindings = resultSummary.keyFindings || resultSummary.key_findings || []
  const impactBreakdown = resultSummary.impactBreakdown || resultSummary.impact_breakdown || []
  const riskFactors = resultSummary.riskFactors || resultSummary.risk_factors || []

  return {
    scenarioName: simulation.name,
    scenarioType: simulation.scenario_type,
    status: simulation.status,
    completedAt: simulation.simulated_at || simulation.created_at,
    metrics: {
      totalCostImpact: getMetricValue('total_cost_impact', '$0'),
      averageDelay: getMetricValue('average_delay', '0 days'),
      inventoryReduction: getMetricValue('inventory_reduction', '0%'),
      recoveryTime: getMetricValue('recovery_time', '0 days'),
      affectedNodes: parseInt(getMetricValue('affected_nodes', '0')) || 0,
      criticalPath: resultSummary.critical_path || 'No critical path identified'
    },
    keyFindings,
    impactBreakdown,
    riskFactors
  }
}

export default function SimulationResultPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // State for simulation data
  const [simulationResults, setSimulationResults] = useState<SimulationResults>(EMPTY_SIMULATION_RESULTS)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEnhancedAnalysis, setIsEnhancedAnalysis] = useState(false)
  const [isGeneratingImpact, setIsGeneratingImpact] = useState(false)

  // Get simulation ID from URL parameters
  const simulationId = searchParams.get('id')

  // Add effect to handle missing simulation ID with localStorage fallback
  useEffect(() => {
    if (!simulationId) {
      const storedSimulationId = localStorage.getItem('currentSimulationId')
      if (storedSimulationId) {
        // Redirect to the URL with the stored simulation ID
        router.replace(`/simulation/result?id=${storedSimulationId}`)
        return
      }
    }
  }, [simulationId, router])

  // Fetch simulation data on component mount
  useEffect(() => {
    const fetchSimulationData = async () => {
      if (!simulationId) {
        // If no simulation ID provided, show empty state
        setSimulationResults(EMPTY_SIMULATION_RESULTS)
        setError('No simulation ID provided. Please select a simulation to view results.')
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        // First try to get enhanced simulation results with AI impact assessment
        try {
          console.log('🤖 Attempting to fetch enhanced simulation results with AI impact assessment')
          const enhancedResults = await getEnhancedSimulationResults(simulationId)
          
          if (enhancedResults && enhancedResults.scenarioName) {
            console.log('✅ Enhanced simulation results retrieved successfully')
            setSimulationResults(normalizeResults(enhancedResults))
            setIsEnhancedAnalysis(true)
            return
          }
        } catch (enhancedError) {
          console.warn('⚠️ Enhanced simulation results not available, falling back to basic data:', enhancedError)
        }

        // Fallback to basic simulation data
        const [simulation, impactResults] = await Promise.all([
          getSimulationById(simulationId),
          getImpactResults(simulationId)
        ])

        if (simulation) {
          // Transform database data to UI format
          const transformedResults = transformSimulationData(simulation, impactResults)
          setSimulationResults(transformedResults)
          setIsEnhancedAnalysis(false)
        } else {
          // If simulation not found, show error
          setError(`Simulation with ID ${simulationId} not found.`)
          setSimulationResults(EMPTY_SIMULATION_RESULTS)
          setIsEnhancedAnalysis(false)
        }
      } catch (err) {
        console.error('Error fetching simulation data:', err)
        setError('Failed to load simulation results.')
        setSimulationResults(EMPTY_SIMULATION_RESULTS)
        setIsEnhancedAnalysis(false)
        // Don't keep default data on error - use empty state
      } finally {
        setIsLoading(false)
      }
    }

    fetchSimulationData()
  }, [simulationId])

  // Function to manually trigger AI impact assessment if needed
  const handleGenerateImpactAssessment = async () => {
    if (!simulationId || isGeneratingImpact) return

    try {
      setIsGeneratingImpact(true)
      setError(null)

      console.log('🚀 Manually triggering comprehensive AI impact assessment')
      const enhancedResults = await triggerImpactAssessment(simulationId, true) // Force refresh

      if (enhancedResults) {
        console.log('✅ AI impact assessment completed successfully')
        setSimulationResults(normalizeResults(enhancedResults))
        setIsEnhancedAnalysis(true)
        toast.success("AI impact assessment completed successfully")
      }
    } catch (err) {
      console.error('❌ Error generating AI impact assessment:', err)
      setError('Failed to generate AI impact assessment. Please try again.')
      toast.error("Failed to generate AI impact assessment")
    } finally {
      setIsGeneratingImpact(false)
    }
  }

  // Create metric cards based on current simulation results
  const metricCards = useMemo(() => [
    {
      label: "Total Cost Impact",
      value: simulationResults.metrics.totalCostImpact,
      icon: DollarSign,
      color: "text-red-600 dark:text-red-400",
      iconColor: "text-red-500"
    },
    {
      label: "Average Delay",
      value: simulationResults.metrics.averageDelay,
      icon: Clock,
      color: "text-orange-600 dark:text-orange-400",
      iconColor: "text-orange-500"
    },
    {
      label: "Inventory Impact",
      value: simulationResults.metrics.inventoryReduction,
      icon: Package,
      color: "text-amber-600 dark:text-amber-400",
      iconColor: "text-amber-500"
    },
    {
      label: "Recovery Time",
      value: simulationResults.metrics.recoveryTime,
      icon: TrendingUp,
      color: "text-blue-600 dark:text-blue-400",
      iconColor: "text-blue-500"
    }
  ] as const, [simulationResults.metrics])

  // Memoize navigation handlers
  const handleBackToSimulation = useMemo(() => () => {
    router.push("/simulation")
  }, [router])

  const handleViewMitigationStrategy = useMemo(() => () => {
    // Pass the simulation ID to mitigation strategy page and store in localStorage as backup
    if (simulationId) {
      localStorage.setItem('currentSimulationId', simulationId)
      router.push(`/simulation/mitigationstrategy?id=${simulationId}`)
    } else {
      router.push("/simulation/mitigationstrategy")
    }
  }, [router, simulationId])

  // Memoize date formatting
  const formattedDate = useMemo(() => {
    return new Date(simulationResults.completedAt).toLocaleString("en-US", {
      year: "numeric",
      month: "long", 
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }, [simulationResults.completedAt])

  // Memoize combined analysis to prevent recalculation
  const combinedAnalysis = useMemo((): AnalysisItem[] => {
    // If no findings or impact data, return empty array
    if (simulationResults.keyFindings.length === 0 && simulationResults.impactBreakdown.length === 0) {
      return []
    }
    
    const analysis: AnalysisItem[] = []
    const maxLength = Math.max(simulationResults.keyFindings.length, simulationResults.impactBreakdown.length)
    
    for (let i = 0; i < maxLength; i++) {
      if (i < simulationResults.keyFindings.length) {
        analysis.push({
          type: 'finding',
          content: simulationResults.keyFindings[i],
          index: i + 1
        })
      }
      if (i < simulationResults.impactBreakdown.length) {
        analysis.push({
          type: 'impact',
          content: simulationResults.impactBreakdown[i],
          index: i + 1
        })
      }
    }
    return analysis
  }, [simulationResults.keyFindings, simulationResults.impactBreakdown])

  // Component for rendering metric cards
  const MetricCard = ({ label, value, icon: Icon, color, iconColor }: {
    label: string;
    value: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    iconColor: string;
  }) => (
    <Card className="p-5 border border-gray-200 dark:border-gray-800 shadow-sm transition-all duration-300">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-2">{label}</p>
          <p className={`text-2xl font-bold text-black dark:text-white`}>{value}</p>
        </div>
        <div className="relative">
          <Icon className={`h-7 w-7 text-gray-400 dark:text-gray-500 relative z-10`} />
        </div>
      </div>
    </Card>
  )

  // Component for rendering analysis items
  const AnalysisItem = ({ item, index }: { item: AnalysisItem; index: number }) => {
    const isFinding = item.type === 'finding'
    const baseClass = "flex items-start gap-4 p-6 rounded-2xl border shadow-lg hover:shadow-xl transition-all duration-300"
    const findingClass = "bg-gradient-to-r from-blue-50/70 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/10 border-blue-200/40 dark:border-blue-800/30"
    const impactClass = "bg-gradient-to-r from-red-50/70 to-pink-50/50 dark:from-red-950/20 dark:to-pink-950/10 border-red-200/40 dark:border-red-800/30"
    
    const delayClass = index % 4 === 0 ? 'delay-0' : 
                       index % 4 === 1 ? 'delay-150' : 
                       index % 4 === 2 ? 'delay-300' : 'delay-500'
    
    return (
      <div className={`group transform transition-all duration-700 hover:scale-[1.02] animate-fade-in ${delayClass}`}>
        <div className={`${baseClass} ${isFinding ? findingClass : impactClass}`}>
          <div className={`w-12 h-12 ${
            isFinding 
              ? 'bg-gradient-to-br from-blue-500 to-indigo-600' 
              : 'bg-gradient-to-br from-red-500 to-pink-600'
          } text-white rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg`}>
            {isFinding ? (
              <span className="text-lg font-bold">{item.index}</span>
            ) : (
              <DollarSign className="w-6 h-6" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={`${
                isFinding 
                  ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30' 
                  : 'bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30'
              }`}>
                {isFinding ? 'Key Finding' : 'Financial Impact'}
              </Badge>
            </div>
            <p className="text-base leading-relaxed text-slate-700 dark:text-slate-300">
              {item.content}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="relative min-h-full flex-1 bg-white dark:bg-black text-black dark:text-white">
        <div className="relative z-10 p-6 px-10">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center min-h-[50vh]">
              <div className="text-center space-y-6">
                <div className="relative">
                  <Activity className="h-16 w-16 animate-spin mx-auto text-black dark:text-white" />
                </div>
                <div className="space-y-2">
                  <p className="text-xl font-semibold">Loading simulation results...</p>
                  <p className="text-sm text-gray-500">Please wait while we prepare your analysis</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-full flex-1 bg-white dark:bg-black text-black dark:text-white">

      <div className="relative z-10 p-6 px-10">
        <div className="max-w-7xl mx-auto">
          {/* Elegant Header */}
          <Card className="p-8 mb-10 border border-gray-200 dark:border-gray-800 bg-white dark:bg-black shadow-sm">
            <div className="flex items-start justify-between">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <Button 
                    variant="ghost" 
                    onClick={handleBackToSimulation}
                    className="flex items-center gap-2 text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2"
                    aria-label="Navigate back to simulation page"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Simulation
                  </Button>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 border border-gray-200 dark:border-gray-800 flex items-center gap-2 px-3 py-1">
                      <CheckCircle className="h-3 w-3 border-gray-800 dark:border-gray-200" />
                      {simulationResults.status.toUpperCase()}
                    </Badge>
                    {isEnhancedAnalysis && (
                      <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 border border-gray-200 dark:border-gray-800 flex items-center gap-2 px-3 py-1">
                        <Sparkles className="h-3 w-3" />
                        AI Enhanced
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h1 className="text-3xl font-bold tracking-tight text-black dark:text-white">
                    Simulation Results
                  </h1>
                  <p className="text-gray-600 dark:text-gray-300 text-base font-semibold">
                    {simulationResults.scenarioName}
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-500 font-medium">
                      <div className="w-2 h-2 bg-gray-400 dark:bg-gray-600 rounded-full"></div>
                      Completed {formattedDate}
                    </div>
                    <div className="text-gray-500 font-medium">
                      {simulationResults.scenarioType}
                    </div>
                  </div>
                </div>
                
                {error && (
                  <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20 px-4 py-2 rounded-lg border border-amber-200/30 dark:border-amber-800/30">
                    <AlertTriangle className="h-4 w-4" />
                    {error}
                  </div>
                )}
              </div>
              
              <div className="flex gap-3">
                {simulationId && !isEnhancedAnalysis && (
                  <Button 
                    onClick={handleGenerateImpactAssessment}
                    disabled={isGeneratingImpact}
                    className="bg-white text-black border border-gray-200 hover:bg-gray-50 dark:bg-black dark:text-white dark:border-gray-800 dark:hover:bg-gray-900 shadow-sm transition-all duration-300 rounded-xl"
                    aria-label="Generate comprehensive AI impact assessment"
                  >
                    {isGeneratingImpact ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-black border-r-transparent dark:border-white" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        AI Analysis
                      </>
                    )}
                  </Button>
                )}
                <Button 
                  onClick={handleViewMitigationStrategy}
                  className="bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 shadow-sm transition-all duration-300 rounded-xl"
                  aria-label="View detailed mitigation strategy"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View Strategy
                </Button>
              </div>
            </div>
          </Card>



          {/* Key Performance Metrics */}
          <section aria-labelledby="metrics-title" className="mb-8">
            <h2 id="metrics-title" className="sr-only">Key Performance Metrics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {metricCards.map((metric, index) => (
                <MetricCard key={metric.label} {...metric} />
              ))}
            </div>
          </section>

          {/* Scenario Overview & Risk Assessment */}
          <section aria-labelledby="overview-title" className="mb-8">
            <h2 id="overview-title" className="sr-only">Scenario Overview and Risk Assessment</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6 border border-gray-200 dark:border-gray-800 bg-white dark:bg-black shadow-sm">
                <CardHeader className="p-0 pb-4">
                  <CardTitle className="flex items-center gap-3 text-xl text-black dark:text-white">
                    <TrendingDown className="h-5 w-5 text-gray-400" />
                    Scenario Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                      <span className="font-medium text-gray-500 dark:text-gray-400 text-sm">Affected Nodes</span>
                      <span className="font-bold text-black dark:text-white text-sm">{simulationResults.metrics.affectedNodes}</span>
                    </div>
                    <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                      <span className="font-medium text-gray-500 dark:text-gray-400 block mb-1 text-sm">Critical Path</span>
                      <span className="text-black dark:text-white text-sm">{simulationResults.metrics.criticalPath}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                      <span className="font-medium text-gray-500 dark:text-gray-400 text-sm">Disruption Type</span>
                      <span className="font-bold text-black dark:text-white text-sm">{simulationResults.scenarioType}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="p-6 border border-gray-200 dark:border-gray-800 bg-white dark:bg-black shadow-sm">
                <CardHeader className="p-0 pb-4">
                  <CardTitle className="flex items-center gap-3 text-xl text-black dark:text-white">
                    <AlertTriangle className="h-5 w-5 text-gray-400" />
                    Risk Factors
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="space-y-3">
                    {simulationResults.riskFactors.length > 0 ? (
                      simulationResults.riskFactors.slice(0, 3).map((factor, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                          <div className="w-6 h-6 bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {index + 1}
                          </div>
                          <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">{factor}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6">
                        <AlertTriangle className="h-6 w-6 text-slate-400 mx-auto mb-2" />
                        <p className="text-slate-500 dark:text-slate-400 text-sm">
                          No risk factors identified yet. Run an impact assessment to identify potential risks.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Tabbed Analysis - Key Findings, Financial Impact, and Total Cost Impact */}
          <section aria-labelledby="analysis-title">
            <Card className="p-6 mb-8 border border-gray-200 dark:border-gray-800 bg-white dark:bg-black shadow-sm">
              <CardHeader className="p-0 pb-6">
                <CardTitle className="text-2xl font-bold text-black dark:text-white" id="analysis-title">
                  Analysis & Impact Assessment
                </CardTitle>
                <CardDescription className="text-base text-gray-500 dark:text-gray-400">
                  {isEnhancedAnalysis ? (
                    <>
                      AI-powered critical insights and financial implications with 
                      {simulationResults.confidenceScore && (
                        <> {((simulationResults.confidenceScore) * 100).toFixed(1)}% confidence score</>
                      )}
                      {simulationResults.cascadingEffects && simulationResults.cascadingEffects.length > 0 && (
                        <> and {simulationResults.cascadingEffects.length} cascading effect analysis</>
                      )}
                    </>
                  ) : (
                    "Critical insights and financial implications from the simulation"
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Tabs defaultValue="key-findings" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-6 bg-gray-100 dark:bg-gray-900 rounded-lg p-1">
                    <TabsTrigger 
                      value="key-findings" 
                      className="flex items-center gap-2 rounded-md data-[state=active]:bg-white data-[state=active]:text-black dark:data-[state=active]:bg-black dark:data-[state=active]:text-white data-[state=active]:shadow-sm text-sm"
                    >
                      <FileText className="h-4 w-4" />
                      Key Findings
                    </TabsTrigger>
                    <TabsTrigger 
                      value="financial-impact" 
                      className="flex items-center gap-2 rounded-md data-[state=active]:bg-white data-[state=active]:text-black dark:data-[state=active]:bg-black dark:data-[state=active]:text-white data-[state=active]:shadow-sm text-sm"
                    >
                      <BarChart3 className="h-4 w-4" />
                      Financial Impact
                    </TabsTrigger>
                    <TabsTrigger 
                      value="total-cost" 
                      className="flex items-center gap-2 rounded-md data-[state=active]:bg-white data-[state=active]:text-black dark:data-[state=active]:bg-black dark:data-[state=active]:text-white data-[state=active]:shadow-sm text-sm"
                    >
                      <Target className="h-4 w-4" />
                      Total Cost Impact
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="key-findings" className="space-y-4">
                    <div className="space-y-3">
                      {simulationResults.keyFindings.length > 0 ? (
                        simulationResults.keyFindings.map((finding, index) => (
                          <div key={index} className="group transform transition-all duration-700 hover:scale-[1.01] animate-fade-in">
                            <div className="flex items-start gap-3 p-4 rounded-lg border shadow-sm hover:shadow-md transition-all duration-300 bg-gradient-to-r from-blue-50/70 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/10 border-blue-200/40 dark:border-blue-800/30">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                                <span className="text-sm font-bold">{index + 1}</span>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge className="bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30 text-xs">
                                    Key Finding
                                  </Badge>
                                </div>
                                <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                                  {finding}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="space-y-3">
                          {/* Generate dynamic key findings based on available data */}
                          {simulationResults.metrics.averageDelay !== '0 days' && (
                            <div className="group transform transition-all duration-700 hover:scale-[1.01] animate-fade-in">
                              <div className="flex items-start gap-3 p-4 rounded-lg border shadow-sm hover:shadow-md transition-all duration-300 bg-gradient-to-r from-blue-50/70 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/10 border-blue-200/40 dark:border-blue-800/30">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                                  <Clock className="w-4 h-4" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Badge className="bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30 text-xs">
                                      Timing Analysis
                                    </Badge>
                                  </div>
                                  <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                                    Supply chain timing analysis shows average operational delays of {simulationResults.metrics.averageDelay} across affected nodes.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {simulationResults.metrics.inventoryReduction !== '0%' && (
                            <div className="group transform transition-all duration-700 hover:scale-[1.01] animate-fade-in delay-75">
                              <div className="flex items-start gap-3 p-4 rounded-lg border shadow-sm hover:shadow-md transition-all duration-300 bg-gradient-to-r from-blue-50/70 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/10 border-blue-200/40 dark:border-blue-800/30">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                                  <Package className="w-4 h-4" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Badge className="bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30 text-xs">
                                      Inventory Impact
                                    </Badge>
                                  </div>
                                  <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                                    Inventory impact analysis reveals {simulationResults.metrics.inventoryReduction} reduction in available inventory across the supply chain network.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {simulationResults.riskFactors.length > 0 && (
                            <div className="group transform transition-all duration-700 hover:scale-[1.01] animate-fade-in delay-150">
                              <div className="flex items-start gap-3 p-4 rounded-lg border shadow-sm hover:shadow-md transition-all duration-300 bg-gradient-to-r from-blue-50/70 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/10 border-blue-200/40 dark:border-blue-800/30">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                                  <AlertTriangle className="w-4 h-4" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Badge className="bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30 text-xs">
                                      Risk Assessment
                                    </Badge>
                                  </div>
                                  <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                                    Risk assessment identifies {simulationResults.riskFactors.length} critical risk factor{simulationResults.riskFactors.length > 1 ? 's' : ''} requiring immediate attention and mitigation planning.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Fallback if no findings */}
                          {simulationResults.metrics.averageDelay === '0 days' && 
                           simulationResults.metrics.inventoryReduction === '0%' && 
                           simulationResults.riskFactors.length === 0 && (
                            <div className="text-center py-8">
                              <FileText className="h-8 w-8 text-slate-400 mx-auto mb-3" />
                              <h3 className="text-base font-semibold text-slate-600 dark:text-slate-300 mb-2">
                                Key Findings In Progress
                              </h3>
                              <p className="text-slate-500 dark:text-slate-400 mb-4 text-sm">
                                {simulationId ? 
                                  "The simulation is being processed. Key findings will be available shortly." :
                                  "Please select a simulation to view key findings."
                                }
                              </p>
                              {simulationId && !isEnhancedAnalysis && (
                                <Button 
                                  onClick={handleGenerateImpactAssessment}
                                  disabled={isGeneratingImpact}
                                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                                >
                                  {isGeneratingImpact ? (
                                    <>
                                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
                                      Generating Analysis...
                                    </>
                                  ) : (
                                    <>
                                      <Sparkles className="mr-2 h-4 w-4" />
                                      Generate AI Analysis
                                    </>
                                  )}
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="financial-impact" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      {/* Financial Metrics Cards */}
                      <div className="p-4 rounded-lg bg-gradient-to-r from-emerald-50/70 to-green-50/50 dark:from-emerald-950/20 dark:to-green-950/10 border border-emerald-200/40 dark:border-emerald-800/30 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-600 text-white rounded-lg flex items-center justify-center">
                            <DollarSign className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Total Cost Impact</h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400">Direct financial impact</p>
                          </div>
                        </div>
                        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                          {simulationResults.metrics.totalCostImpact}
                        </p>
                      </div>
                      
                      <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50/70 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/10 border border-blue-200/40 dark:border-blue-800/30 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-lg flex items-center justify-center">
                            <TrendingUp className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Recovery Time</h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400">Time to normalize</p>
                          </div>
                        </div>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {simulationResults.metrics.recoveryTime}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {simulationResults.impactBreakdown.length > 0 ? (
                        simulationResults.impactBreakdown.map((impact, index) => (
                          <div key={index} className="group transform transition-all duration-700 hover:scale-[1.01] animate-fade-in">
                            <div className="flex items-start gap-3 p-4 rounded-lg border shadow-sm hover:shadow-md transition-all duration-300 bg-gradient-to-r from-emerald-50/70 to-green-50/50 dark:from-emerald-950/20 dark:to-green-950/10 border-emerald-200/40 dark:border-emerald-800/30">
                              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-600 text-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                                <DollarSign className="w-4 h-4" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-xs">
                                    Financial Impact
                                  </Badge>
                                </div>
                                <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                                  {impact}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="space-y-3">
                          {/* Generate dynamic financial impact based on available data */}
                          {simulationResults.metrics.totalCostImpact !== '$0' && (
                            <div className="group transform transition-all duration-700 hover:scale-[1.01] animate-fade-in">
                              <div className="flex items-start gap-3 p-4 rounded-lg border shadow-sm hover:shadow-md transition-all duration-300 bg-gradient-to-r from-emerald-50/70 to-green-50/50 dark:from-emerald-950/20 dark:to-green-950/10 border-emerald-200/40 dark:border-emerald-800/30">
                                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-600 text-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                                  <DollarSign className="w-4 h-4" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-xs">
                                      Primary Impact
                                    </Badge>
                                  </div>
                                  <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                                    Financial impact analysis reveals total cost impact of {simulationResults.metrics.totalCostImpact} from the {simulationResults.scenarioType.toLowerCase()} scenario.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {simulationResults.metrics.affectedNodes > 0 && (
                            <div className="group transform transition-all duration-700 hover:scale-[1.01] animate-fade-in delay-75">
                              <div className="flex items-start gap-3 p-4 rounded-lg border shadow-sm hover:shadow-md transition-all duration-300 bg-gradient-to-r from-emerald-50/70 to-green-50/50 dark:from-emerald-950/20 dark:to-green-950/10 border-emerald-200/40 dark:border-emerald-800/30">
                                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-600 text-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                                  <Activity className="w-4 h-4" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-xs">
                                      Network Impact
                                    </Badge>
                                  </div>
                                  <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                                    Network impact assessment identifies {simulationResults.metrics.affectedNodes} node{simulationResults.metrics.affectedNodes > 1 ? 's' : ''} directly affected by the disruption scenario.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {(simulationResults.cascadingEffects && simulationResults.cascadingEffects.length > 0) && (
                            <div className="group transform transition-all duration-700 hover:scale-[1.01] animate-fade-in delay-150">
                              <div className="flex items-start gap-3 p-4 rounded-lg border shadow-sm hover:shadow-md transition-all duration-300 bg-gradient-to-r from-emerald-50/70 to-green-50/50 dark:from-emerald-950/20 dark:to-green-950/10 border-emerald-200/40 dark:border-emerald-800/30">
                                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-600 text-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                                  <Zap className="w-4 h-4" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-xs">
                                      Cascading Effects
                                    </Badge>
                                  </div>
                                  <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                                    Cascading effect analysis reveals {simulationResults.cascadingEffects.length} potential secondary impact{simulationResults.cascadingEffects.length > 1 ? 's' : ''} propagating through the supply chain network.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Fallback if no financial impact */}
                          {simulationResults.metrics.totalCostImpact === '$0' && 
                           simulationResults.metrics.affectedNodes === 0 && 
                           (!simulationResults.cascadingEffects || simulationResults.cascadingEffects.length === 0) && (
                            <div className="text-center py-8">
                              <BarChart3 className="h-8 w-8 text-slate-400 mx-auto mb-3" />
                              <h3 className="text-base font-semibold text-slate-600 dark:text-slate-300 mb-2">
                                Financial Impact Analysis In Progress
                              </h3>
                              <p className="text-slate-500 dark:text-slate-400 mb-4 text-sm">
                                {simulationId ? 
                                  "The simulation is being processed. Financial impact analysis will be available shortly." :
                                  "Please select a simulation to view financial impact analysis."
                                }
                              </p>
                              {simulationId && !isEnhancedAnalysis && (
                                <Button 
                                  onClick={handleGenerateImpactAssessment}
                                  disabled={isGeneratingImpact}
                                  className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
                                >
                                  {isGeneratingImpact ? (
                                    <>
                                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
                                      Generating Analysis...
                                    </>
                                  ) : (
                                    <>
                                      <Sparkles className="mr-2 h-4 w-4" />
                                      Generate AI Analysis
                                    </>
                                  )}
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="total-cost" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      {/* Total Cost Breakdown Cards */}
                      <div className="p-4 rounded-lg bg-gradient-to-r from-red-50/70 to-pink-50/50 dark:from-red-950/20 dark:to-pink-950/10 border border-red-200/40 dark:border-red-800/30 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-600 text-white rounded-lg flex items-center justify-center">
                            <DollarSign className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Total Cost</h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400">Overall impact</p>
                          </div>
                        </div>
                        <p className="text-xl font-bold text-red-600 dark:text-red-400">
                          {simulationResults.metrics.totalCostImpact}
                        </p>
                      </div>
                      
                      <div className="p-4 rounded-lg bg-gradient-to-r from-orange-50/70 to-amber-50/50 dark:from-orange-950/20 dark:to-amber-950/10 border border-orange-200/40 dark:border-orange-800/30 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-600 text-white rounded-lg flex items-center justify-center">
                            <Clock className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Delay Cost</h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400">Time-based impact</p>
                          </div>
                        </div>
                        <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
                          {simulationResults.metrics.averageDelay}
                        </p>
                      </div>
                      
                      <div className="p-4 rounded-lg bg-gradient-to-r from-yellow-50/70 to-amber-50/50 dark:from-yellow-950/20 dark:to-amber-950/10 border border-yellow-200/40 dark:border-yellow-800/30 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-amber-600 text-white rounded-lg flex items-center justify-center">
                            <Package className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Inventory Loss</h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400">Stock reduction</p>
                          </div>
                        </div>
                        <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
                          {simulationResults.metrics.inventoryReduction}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {/* Combined cost analysis */}
                      <div className="group transform transition-all duration-700 hover:scale-[1.01] animate-fade-in">
                        <div className="flex items-start gap-3 p-4 rounded-lg border shadow-sm hover:shadow-md transition-all duration-300 bg-gradient-to-r from-red-50/70 to-pink-50/50 dark:from-red-950/20 dark:to-pink-950/10 border-red-200/40 dark:border-red-800/30">
                          <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-600 text-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                            <Target className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className="bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30 text-xs">
                                Total Cost Impact
                              </Badge>
                            </div>
                            <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                              Comprehensive cost analysis shows a total financial impact of {simulationResults.metrics.totalCostImpact} from the {simulationResults.scenarioType.toLowerCase()} scenario, with recovery expected in {simulationResults.metrics.recoveryTime}.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {simulationResults.metrics.affectedNodes > 0 && (
                        <div className="group transform transition-all duration-700 hover:scale-[1.01] animate-fade-in delay-75">
                          <div className="flex items-start gap-3 p-4 rounded-lg border shadow-sm hover:shadow-md transition-all duration-300 bg-gradient-to-r from-red-50/70 to-pink-50/50 dark:from-red-950/20 dark:to-pink-950/10 border-red-200/40 dark:border-red-800/30">
                            <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-600 text-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                              <Activity className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className="bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30 text-xs">
                                  Network Cost Distribution
                                </Badge>
                              </div>
                              <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                                Cost impact is distributed across {simulationResults.metrics.affectedNodes} network node{simulationResults.metrics.affectedNodes > 1 ? 's' : ''}, with varying degrees of financial exposure based on node criticality and dependency relationships.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {simulationResults.metrics.inventoryReduction !== '0%' && (
                        <div className="group transform transition-all duration-700 hover:scale-[1.01] animate-fade-in delay-150">
                          <div className="flex items-start gap-3 p-4 rounded-lg border shadow-sm hover:shadow-md transition-all duration-300 bg-gradient-to-r from-red-50/70 to-pink-50/50 dark:from-red-950/20 dark:to-pink-950/10 border-red-200/40 dark:border-red-800/30">
                            <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-600 text-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                              <Package className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className="bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30 text-xs">
                                  Inventory Cost Impact
                                </Badge>
                              </div>
                              <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                                Inventory reduction of {simulationResults.metrics.inventoryReduction} contributes significantly to the total cost impact, affecting both immediate availability and long-term supply chain resilience.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Fallback if no cost data */}
                      {simulationResults.metrics.totalCostImpact === '$0' && 
                       simulationResults.metrics.averageDelay === '0 days' && 
                       simulationResults.metrics.inventoryReduction === '0%' && (
                        <div className="text-center py-8">
                          <Target className="h-8 w-8 text-slate-400 mx-auto mb-3" />
                          <h3 className="text-base font-semibold text-slate-600 dark:text-slate-300 mb-2">
                            Total Cost Impact Analysis In Progress
                          </h3>
                          <p className="text-slate-500 dark:text-slate-400 mb-4 text-sm">
                            {simulationId ? 
                              "The simulation is being processed. Total cost impact analysis will be available shortly." :
                              "Please select a simulation to view total cost impact analysis."
                            }
                          </p>
                          {simulationId && !isEnhancedAnalysis && (
                            <Button 
                              onClick={handleGenerateImpactAssessment}
                              disabled={isGeneratingImpact}
                              className="bg-white text-black border border-gray-200 hover:bg-gray-50 dark:bg-black dark:text-white dark:border-gray-800 dark:hover:bg-gray-900 shadow-sm transition-all duration-300"
                            >
                              {isGeneratingImpact ? (
                                <>
                                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-black border-r-transparent dark:border-white" />
                                  Generating Analysis...
                                </>
                              ) : (
                                <>
                                  <Sparkles className="mr-2 h-4 w-4" />
                                  Generate AI Analysis
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </section>

          {/* Cascading Effects Analysis - Show whenever cascading effects exist */}
          {simulationResults.cascadingEffects && simulationResults.cascadingEffects.length > 0 && (
            <section aria-labelledby="cascading-title">
              <Card className="p-6 mb-8 border border-gray-200 dark:border-gray-800 bg-white dark:bg-black shadow-sm">
                <CardHeader className="p-0 pb-6">
                  <CardTitle className="text-2xl font-bold text-black dark:text-white" id="cascading-title">
                    Cascading Effects Analysis
                  </CardTitle>
                  <CardDescription className="text-base text-gray-500 dark:text-gray-400">
                    AI-identified potential cascading impacts across the supply chain network
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="grid gap-3">
                    {simulationResults.cascadingEffects.map((effect, index) => (
                      <div key={index} className="p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold ${
                            effect.severity === 'CRITICAL' ? 'bg-black dark:bg-white dark:text-black font-bold' :
                            effect.severity === 'HIGH' ? 'bg-gray-800 dark:bg-gray-200 dark:text-black font-bold' :
                            effect.severity === 'MEDIUM' ? 'bg-gray-600 dark:bg-gray-400 dark:text-black font-bold' :
                            'bg-gray-400 dark:bg-gray-600 dark:text-black font-bold'
                          }`}>
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={`text-xs ${
                                effect.severity === 'CRITICAL' ? 'bg-black text-white dark:bg-white dark:text-black border-transparent' :
                                effect.severity === 'HIGH' ? 'bg-gray-800 text-white dark:bg-gray-200 dark:text-black border-transparent' :
                                effect.severity === 'MEDIUM' ? 'bg-gray-600 text-white dark:bg-gray-400 dark:text-black border-transparent' :
                                'bg-gray-400 text-white dark:bg-gray-600 dark:text-black border-transparent'
                              }`}>
                                {effect.severity} Impact
                              </Badge>
                              <Badge variant="outline" className="text-xs border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300">
                                {effect.timeline}
                              </Badge>
                            </div>
                            <h4 className="font-semibold text-black dark:text-white mb-1 text-sm">
                              {effect.affectedNode}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {effect.impactType}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </section>
          )}

          {/* Mitigation Strategies - Show whenever strategies exist */}
          {simulationResults.mitigationStrategies && simulationResults.mitigationStrategies.length > 0 && (
            <section aria-labelledby="mitigation-title">
              <Card className="p-6 mb-8 border border-gray-200 dark:border-gray-800 bg-white dark:bg-black shadow-sm">
                <CardHeader className="p-0 pb-6">
                  <CardTitle className="text-2xl font-bold text-black dark:text-white" id="mitigation-title">
                    AI-Recommended Mitigation Strategies
                  </CardTitle>
                  <CardDescription className="text-base text-gray-500 dark:text-gray-400">
                    Strategic recommendations with ROI analysis and implementation roadmap
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="space-y-4">
                    {simulationResults.mitigationStrategies.slice(0, 3).map((strategy, index) => (
                      <div key={index} className="p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold ${
                            strategy.feasibility === 'HIGH' ? 'bg-black dark:bg-white dark:text-black' :
                            strategy.feasibility === 'MEDIUM' ? 'bg-gray-600 dark:bg-gray-400 dark:text-black' :
                            'bg-gray-400 dark:bg-gray-600 dark:text-black'
                          }`}>
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-3">
                              <Badge className={`text-xs ${
                                strategy.feasibility === 'HIGH' ? 'bg-black text-white dark:bg-white dark:text-black border-transparent' :
                                strategy.feasibility === 'MEDIUM' ? 'bg-gray-600 text-white dark:bg-gray-400 dark:text-black border-transparent' :
                                'bg-gray-400 text-white dark:bg-gray-600 dark:text-black border-transparent'
                              }`}>
                                {strategy.feasibility} Feasibility
                              </Badge>
                            </div>
                            <p className="text-sm text-black dark:text-white mb-3 leading-relaxed">
                              {strategy.strategy}
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                              <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-md p-2">
                                <div className="font-semibold text-gray-500 dark:text-gray-400 text-xs">Cost</div>
                                <div className="text-black dark:text-white text-xs">{strategy.estimatedCost}</div>
                              </div>
                              <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-md p-2">
                                <div className="font-semibold text-gray-500 dark:text-gray-400 text-xs">Timeline</div>
                                <div className="text-black dark:text-white text-xs">{strategy.timeToImplement}</div>
                              </div>
                              <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-md p-2">
                                <div className="font-semibold text-gray-500 dark:text-gray-400 text-xs">Risk Reduction</div>
                                <div className="text-black dark:text-white text-xs">{strategy.riskReduction}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </section>
          )}

          {/* Node Analysis Section */}
          {/* <section aria-labelledby="node-analysis-title">
            <Card className="p-6 border border-gray-200 dark:border-gray-800 bg-white dark:bg-black shadow-sm">
              <CardHeader className="p-0 pb-6">
                <CardTitle className="text-2xl font-bold text-black dark:text-white" id="node-analysis-title">
                  Supply Chain Node Analysis
                </CardTitle>
                <CardDescription className="text-base text-gray-500 dark:text-gray-400">
                  Detailed impact assessment across all network nodes
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <NodeImpactGridWithVisualize 
                  nodes={DEFAULT_SIMULATION_NODES}
                  title="Supply Chain Node Analysis"
                  description="Detailed impact assessment across all network nodes"
                />
              </CardContent>
            </Card>
          </section> */}
        </div>
      </div>
    </div>
  )
}
