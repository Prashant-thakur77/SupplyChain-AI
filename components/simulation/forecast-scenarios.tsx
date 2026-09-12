"use client"

import React, { useState, useEffect } from "react"
import { 
  AlertTriangle, 
  TrendingUp, 
  Clock, 
  Sparkles, 
  RefreshCw, 
  Loader2,
  Brain,
  Zap,
  Globe,
  Shield,
  BarChart3,
  CheckCircle,
  Network
} from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { ScenarioData, useScenario } from "@/lib/context/scenario-context"
import { useUser } from "@/lib/stores/user"
import { scenarioCache } from "@/lib/utils/scenario-cache"
import { toast } from "sonner"

// Minimalist Card Component
function MinimalCard({ 
  children, 
  className = "", 
  ...props 
}: { 
  children: React.ReactNode
  className?: string
  [key: string]: any 
}) {
  return (
    <Card 
      className={cn(
        "border border-theme-border-subtle bg-theme-bg-surface text-theme-text-primary shadow-sm rounded-theme-lg transition-all duration-300 relative overflow-hidden cursor-pointer",
        "hover:-translate-y-1.5 hover:shadow-md hover:border-t-2 hover:border-t-theme-blue",
        className
      )} 
      {...props}
    >
      {children}
    </Card>
  )
}

interface ForecastScenariosProps {
  onSelectScenario: (scenario: ScenarioData) => void
}

export function ForecastScenarios({ onSelectScenario }: ForecastScenariosProps) {
  const [scenarios, setScenarios] = useState<ScenarioData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [processingTime, setProcessingTime] = useState<number | null>(null)
  const [fromCache, setFromCache] = useState(false)

  // const { userData } = useUser()
  const { selectedSupplyChainId, setSelectedSupplyChainId, supplyChains } = useScenario()

  // Map API scenario types to UI scenario types
  const mapScenarioType = (apiType: string): string => {
    const typeMapping: { [key: string]: string } = {
      // Forecast scenario types
      'natural': 'natural',
      'geopolitical': 'political',
      'economic': 'political',
      'operational': 'disruption',
      'regulatory': 'political',
      'other': 'disruption',
      // Legacy scenario types
      'NATURAL_DISASTER': 'natural',
      'GEOPOLITICAL': 'political',
      'CYBER_ATTACK': 'disruption',
      'SUPPLY_SHORTAGE': 'disruption',
      'DEMAND_SURGE': 'demand',
      'REGULATORY': 'political',
      'ECONOMIC': 'political',
      'PANDEMIC': 'natural',
      'INFRASTRUCTURE': 'disruption',
      'CLIMATE': 'natural'
    }
    return typeMapping[apiType.toLowerCase()] || typeMapping[apiType] || 'disruption'
  }

  const getSeverityColor = (severity: number) => {
    if (severity >= 80) return 'bg-theme-red/10 text-theme-red border border-theme-red/20 font-bold'
    if (severity >= 60) return 'bg-theme-amber/10 text-theme-amber border border-theme-amber/20 font-bold'
    if (severity >= 40) return 'bg-theme-amber/5 text-theme-amber border border-theme-amber/10 font-bold'
    return 'bg-theme-green/10 text-theme-green border border-theme-green/20 font-bold'
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'natural': return AlertTriangle
      case 'political': return Globe
      case 'demand': return TrendingUp
      case 'disruption': return Zap
      default: return Shield
    }
  }

  // Enhanced refresh function
  const handleRefresh = async () => {
    if (selectedSupplyChainId) {
      scenarioCache.clear(selectedSupplyChainId)
      await fetchScenarios(true)
      toast("Scenarios Refreshed", { description: "AI forecast scenarios have been updated with latest data." })
    }
  }

  // Generate brand-new AI scenarios and save them to Supabase
  const handleGenerateForecast = async () => {
    if (!selectedSupplyChainId || isGenerating) return
    setIsGenerating(true)
    try {
      toast("Generating AI Forecast…", { description: "Analyzing your supply chain and generating real scenarios. This takes ~15 seconds." })
      const response = await fetch('/api/agent/forecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplyChainId: selectedSupplyChainId,
          forecastHorizon: 30,
          includeWeather: true,
          includeMarketData: true,
        }),
      })
      const data = await response.json()
      if (response.ok && data.success) {
        toast("Forecast Generated!", { description: `${data.forecast?.scenarios?.length ?? 0} AI scenarios saved. Refreshing cards…` })
        // Clear cache and reload from the freshly saved Supabase row
        scenarioCache.clear(selectedSupplyChainId)
        await fetchScenarios(true)
      } else {
        toast("Forecast Failed", { description: data.error || data.message || "Unknown error from forecast agent." })
      }
    } catch (err: any) {
      toast("Forecast Failed", { description: err.message })
    } finally {
      setIsGenerating(false)
    }
  }

  // Fetch scenarios from the forecast table's scenario_json column
  const fetchScenarios = async (forceRefresh = false) => {
    if (!selectedSupplyChainId) return

    // Check cache first
    const cachedScenarios = scenarioCache.get(selectedSupplyChainId)
    if (cachedScenarios && !forceRefresh) {
      console.log('📋 Using cached forecast scenarios')
      setScenarios(cachedScenarios)
      setFromCache(true)
      return
    }

    setIsLoading(true)
    setFromCache(false)
    const startTime = Date.now()

    try {
      console.log('🔍 Fetching forecast scenarios from database...')
      
      const response = await fetch(`/api/forecast-scenarios?supply_chain_id=${selectedSupplyChainId}`)

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success && data.scenarios) {
        const transformedScenarios: ScenarioData[] = data.scenarios.map((scenario: any) => ({
          scenarioName: scenario.scenarioName || 'AI Generated Scenario',
          scenarioType: mapScenarioType(scenario.scenarioType || 'operational'),
          description: scenario.description || 'AI-generated scenario based on current risk analysis',
          disruptionSeverity: scenario.disruptionSeverity || 75,
          disruptionDuration: scenario.disruptionDuration || 14,
          affectedNode: scenario.affectedNode || 'supplier-a',
          startDate: scenario.startDate || '',
          endDate: scenario.endDate || '',
          monteCarloRuns: scenario.monteCarloRuns || 1000,
          distributionType: scenario.distributionType || 'normal',
          cascadeEnabled: scenario.cascadeEnabled !== undefined ? scenario.cascadeEnabled : true,
          failureThreshold: scenario.failureThreshold || 0.5,
          bufferPercent: scenario.bufferPercent || 15,
          alternateRouting: scenario.alternateRouting !== undefined ? scenario.alternateRouting : true,
          randomSeed: scenario.randomSeed || ''
        }))

        setScenarios(transformedScenarios)
        scenarioCache.set(selectedSupplyChainId, transformedScenarios)
        
        const processingTime = Date.now() - startTime
        setProcessingTime(processingTime)
        
        console.log(`✅ Successfully loaded ${transformedScenarios.length} forecast scenarios`)
        
        if (transformedScenarios.length === 0) {
           toast("Event has been created.",{ description:"No forecast scenarios found for this supply chain. Generate a forecast first."})
        }
      } else {
        console.log('📭 No scenarios available:', data.message)
        setScenarios([])
      }
    } catch (error) {
      console.error('❌ Error fetching forecast scenarios:', error)
      toast("Failed to Load Forecast Scenarios",{ description:"Unable to fetch forecast scenarios. Please try again."})

      setScenarios([])
    } finally {
      setIsLoading(false)
    }
  }

  // Auto-fetch scenarios when component mounts and supply chain is selected
  useEffect(() => {
    if (selectedSupplyChainId) {
      fetchScenarios()
    }
  }, [selectedSupplyChainId])

  if (!selectedSupplyChainId) {
    return (
      <MinimalCard className="text-center py-8">
        <CardContent>
          <Network className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
            No Supply Chain Selected
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            {supplyChains && supplyChains.length > 1 
              ? `You have ${supplyChains.length} supply chains. Please select one above to view AI-generated forecast scenarios.`
              : "Please select a supply chain to view AI-generated forecast scenarios."
            }
          </p>
          {supplyChains && supplyChains.length > 0 && (
            <div className="flex justify-center">
              <Select value="" onValueChange={setSelectedSupplyChainId}>
                <SelectTrigger className="w-[280px]">
                  <SelectValue placeholder="Select a supply chain" />
                </SelectTrigger>
                <SelectContent>
                  {supplyChains.map((chain, index) => (
                    <SelectItem key={chain.supply_chain_id || `chain-${index}`} value={chain.supply_chain_id}>
                      <div className="flex items-center gap-2">
                        <Network className="h-4 w-4 text-slate-500" />
                        {chain.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
    </MinimalCard>
  )
}

  return (
    <div className="space-y-6">
      {/* Header with Supply Chain Selector */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/5 dark:bg-primary/10 border border-primary/10 rounded-xl flex items-center justify-center shadow-[0_2px_8px_rgba(11,79,255,0.05)]">
              <Brain className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground">
                AI Forecast Scenarios
              </h3>
              <p className="text-sm text-muted-foreground">
                High-alert scenarios based on current risk analysis
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {fromCache && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                Cached Results
              </Badge>
            )}

            {processingTime && (
              <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                {processingTime}ms
              </Badge>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading || isGenerating}
              className="flex items-center gap-2"
            >
              <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
              Refresh
            </Button>

            <Button
              size="sm"
              onClick={handleGenerateForecast}
              disabled={isGenerating || isLoading || !selectedSupplyChainId}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {isGenerating ? 'Generating…' : 'Generate AI Forecast'}
            </Button>
          </div>
        </div>

        {/* Supply Chain Selector - Only show if multiple supply chains */}
        {supplyChains && supplyChains.length > 1 && (
          <div className="flex items-center gap-3 p-4 bg-card/40 backdrop-blur-md rounded-xl border border-border/40 shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
            <Network className="w-5 h-5 text-primary" />
            <div className="flex items-center gap-3 flex-1">
              <label className="text-sm font-medium text-foreground">
                Supply Chain:
              </label>
              <Select value={selectedSupplyChainId || ''} onValueChange={setSelectedSupplyChainId}>
                <SelectTrigger className="w-[300px] bg-background">
                  <SelectValue placeholder="Select supply chain to view forecast scenarios" />
                </SelectTrigger>
                <SelectContent>
                  {supplyChains.map((chain, index) => (
                    <SelectItem key={chain.supply_chain_id || `chain-sel-${index}`} value={chain.supply_chain_id}>
                      <div className="flex items-center gap-2">
                        <Network className="h-4 w-4 text-primary" />
                        {chain.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedSupplyChainId && (
              <Badge variant="outline" className="text-xs">
                Selected: {supplyChains.find(c => c.supply_chain_id === selectedSupplyChainId)?.name}
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <MinimalCard key={i} className="animate-pulse">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded"></div>
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-5/6"></div>
                  <div className="flex gap-2">
                    <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-16"></div>
                    <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-20"></div>
                  </div>
                </div>
              </CardContent>
            </MinimalCard>
          ))}
        </div>
      )}

      {/* Scenarios Grid */}
      {!isLoading && scenarios.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {scenarios.map((scenario, index) => {
            const TypeIcon = getTypeIcon(scenario.scenarioType)
            
            return (
              <MinimalCard 
                key={index} 
                className="group cursor-pointer relative overflow-hidden"
                onClick={() => onSelectScenario(scenario)}
              >
                {/* High Alert Badge */}
                <div className="absolute top-3 right-3 z-10">
                  <Badge className="bg-theme-red text-white border-none font-bold uppercase tracking-widest text-[9px] px-2 py-0.5 rounded-theme-pill">
                    High Alert
                  </Badge>
                </div>

                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-primary/5 dark:bg-primary/10 border border-primary/10 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                      <TypeIcon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 pr-8">
                      <CardTitle className="text-base leading-tight group-hover:text-primary transition-colors duration-300">
                        {scenario.scenarioName}
                      </CardTitle>
                      <CardDescription className="text-sm mt-1">
                        AI-generated based on risk patterns
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {scenario.description}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    <Badge 
                      className={getSeverityColor(scenario.disruptionSeverity)} 
                      variant="secondary"
                    >
                      {scenario.disruptionSeverity}% severity
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      <Clock className="w-3 h-3 mr-1" />
                      {scenario.disruptionDuration} days
                    </Badge>
                    <Badge variant="outline" className="text-xs capitalize">
                      {scenario.scenarioType}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <BarChart3 className="w-3 h-3" />
                    {scenario.monteCarloRuns.toLocaleString()} simulations
                    {scenario.cascadeEnabled && (
                      <>
                        <Separator orientation="vertical" className="h-3" />
                        <span className="flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          Cascade enabled
                        </span>
                      </>
                    )}
                  </div>
                </CardContent>

                <CardFooter className="pt-0">
                  <Button
                    className="w-full bg-transparent border-transparent text-theme-blue hover:bg-theme-blue-soft hover:text-theme-blue hover:border-transparent transition-all duration-200 rounded-theme-md text-xs font-semibold shadow-none"
                    variant="ghost"
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-2 text-theme-blue" />
                    Use This Scenario
                  </Button>
                </CardFooter>
              </MinimalCard>
            )
          })}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && scenarios.length === 0 && (
        <MinimalCard className="text-center py-12">
          <CardContent>
            <Brain className="w-16 h-16 text-primary/80 mx-auto mb-4 animate-pulse" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No Forecast Scenarios Available
            </h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              No forecast has been generated for this supply chain yet. Generate a forecast first to see scenarios here.
            </p>
            <Button 
              onClick={() => fetchScenarios(true)}
              variant="outline"
              className="flex items-center gap-2 rounded-xl"
            >
              <RefreshCw className="w-4 h-4" />
              Check Again
            </Button>
          </CardContent>
        </MinimalCard>
      )}
    </div>
  )
}
