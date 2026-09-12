"use client"

import React, { useState, useEffect, useMemo } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Sparkles, ArrowRight, AlertTriangle, CloudLightning, Briefcase, ShoppingCart, Building, Loader2, RefreshCw, Wand2, Search, Clock, TrendingUp, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ScenarioData, useScenario } from "@/lib/context/scenario-context" 
import { useUser } from "@/lib/stores/user"
import { useToast } from "@/hooks/use-toast"
import { scenarioCache } from "@/lib/utils/scenario-cache"

interface AIScenarioSuggestionsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectScenario: (scenario: ScenarioData) => void
}

export function AIScenarioSuggestions({ open, onOpenChange, onSelectScenario }: AIScenarioSuggestionsProps) {
  const [scenarios, setScenarios] = useState<ScenarioData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isGeneratingCustom, setIsGeneratingCustom] = useState(false)
  const [customPrompt, setCustomPrompt] = useState("")
  const [scenarioCount, setScenarioCount] = useState(3)
  const [processingTime, setProcessingTime] = useState<number | null>(null)
  const [fromCache, setFromCache] = useState(false)
  const [hasInitiallyFetched, setHasInitiallyFetched] = useState<string | null>(null) // Track which supply chain we've fetched for
  const [searchQuery, setSearchQuery] = useState("")
  const { userData } = useUser()
  const { toast } = useToast()
  const { updateScenarioData, selectedSupplyChainId } = useScenario()
  
  // Force refetch when needed
  const [refreshKey, setRefreshKey] = useState(0)
  
  // Map API scenario types to UI scenario types with better coverage
  const mapScenarioType = (apiType: string): string => {
    const typeMapping: { [key: string]: string } = {
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
    return typeMapping[apiType] || 'disruption'
  }
  
  // Enhanced refresh function with proper cache clearing
  const handleRefresh = () => {
    if (selectedSupplyChainId) {
      scenarioCache.clear(selectedSupplyChainId)
      toast({
        title: "Cache Cleared",
        description: "Refreshing scenarios with latest data...",
      })
    }
    setRefreshKey(prev => prev + 1)
    setFromCache(false)
    setHasInitiallyFetched(null) // Reset fetch tracking
  }
  
  // Filter scenarios based on search query
  const filteredScenarios = useMemo(() => {
    if (!searchQuery.trim()) return scenarios
    
    const query = searchQuery.toLowerCase()
    return scenarios.filter(scenario => 
      scenario.scenarioName.toLowerCase().includes(query) ||
      scenario.description.toLowerCase().includes(query) ||
      scenario.affectedNode.toLowerCase().includes(query) ||
      scenario.scenarioType.toLowerCase().includes(query)
    )
  }, [scenarios, searchQuery])
  
  // Clear search query
  const clearSearch = () => {
    setSearchQuery("")
  }
  
  // Fetch scenarios from the AI agent API when the sheet is opened
  useEffect(() => {
    async function fetchScenarios() {
      if (!open || !userData?.id || !selectedSupplyChainId) return
      
      // Always check cache first, unless explicitly forcing refresh
      const cachedScenarios = scenarioCache.get(selectedSupplyChainId)
      if (cachedScenarios && refreshKey === 0) {
        console.log('📋 Using cached scenarios')
        setScenarios(cachedScenarios)
        setFromCache(true)
        return
      }
      
      // If we already have scenarios and not forcing refresh, don't fetch again
      if (scenarios.length > 0 && refreshKey === 0) {
        console.log('📋 Using existing scenarios in state')
        return
      }
      
      // Check if we've already fetched for this supply chain (prevent double fetching)
      if (hasInitiallyFetched === selectedSupplyChainId && refreshKey === 0) {
        console.log('📋 Already fetched for this supply chain')
        return
      }
      
      setIsLoading(true)
      setFromCache(false)
      const startTime = Date.now()
      
      try {
        console.log(`🚀 Fetching scenarios for supply chain: ${selectedSupplyChainId}`)
        
        const response = await fetch(`/api/agent/scenario`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
          body: JSON.stringify({ 
            supplyChainId: selectedSupplyChainId,
            scenarioCount: 3,
            timeHorizon: 90,
            focusType: 'ALL',
            includeHistorical: true,
            forceRefresh: refreshKey > 0 
          }),
        })
        
        const data = await response.json()
        const endTime = Date.now()
        setProcessingTime(endTime - startTime)
        
        if (!response.ok) {
          throw new Error(data.details || data.error || 'Failed to fetch scenarios')
        }
        
        console.log('✅ Scenario API Response:', data)
        
        if (data.success && data.scenarios && Array.isArray(data.scenarios)) {
          // Transform the scenarios to match our ScenarioData type
          const transformedScenarios: ScenarioData[] = data.scenarios.map((scenario: any) => ({
            scenarioName: scenario.scenarioName || '',
            scenarioType: mapScenarioType(scenario.scenarioType || 'DISRUPTION'),
            disruptionSeverity: Number(scenario.disruptionSeverity) || 0,
            disruptionDuration: Number(scenario.disruptionDuration) || 0,
            affectedNode: scenario.affectedNode || '',
            description: scenario.description || '',
            startDate: scenario.startDate || new Date().toISOString(),
            endDate: scenario.endDate || new Date().toISOString(),
            monteCarloRuns: Number(scenario.monteCarloRuns) || 10000,
            distributionType: scenario.distributionType || 'normal',
            cascadeEnabled: Boolean(scenario.cascadeEnabled),
            failureThreshold: Number(scenario.failureThreshold) || 0.3,
            bufferPercent: Number(scenario.bufferPercent) || 15,
            alternateRouting: Boolean(scenario.alternateRouting),
            randomSeed: scenario.randomSeed || `seed-${Date.now()}`
          }))
          
          console.log(`📊 Transformed ${transformedScenarios.length} scenarios`)
          setScenarios(transformedScenarios)
          setFromCache(data.fromCache || false)
          setHasInitiallyFetched(selectedSupplyChainId) // Mark as fetched
          
          // Cache the scenarios for future use
          scenarioCache.set(selectedSupplyChainId, transformedScenarios)
          
          toast({
            title: "Scenarios Generated",
            description: `${transformedScenarios.length} AI scenarios ready in ${Math.round((processingTime || 0) / 1000)}s`,
          })
        } else {
          console.warn('⚠️ No scenarios in response or invalid format')
          setScenarios([])
          toast({
            title: "No Scenarios",
            description: "No scenarios were generated. Try refreshing or check your supply chain data.",
            variant: "destructive"
          })
        }
      } catch (error) {
        console.error('❌ Error fetching scenarios:', error)
        setScenarios([])
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to fetch AI scenario suggestions",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchScenarios()
  }, [open, userData?.id, selectedSupplyChainId, refreshKey, toast])

  // Generate custom scenario from user prompt
  const generateCustomScenario = async () => {
    if (!customPrompt.trim() || !selectedSupplyChainId) {
      toast({
        title: "Error",
        description: "Please enter a scenario description and select a supply chain",
        variant: "destructive"
      })
      return
    }

    setIsGeneratingCustom(true)
    const startTime = Date.now()
    
    try {
      console.log(`🎯 Generating custom scenarios with prompt: ${customPrompt}`)
      
      const response = await fetch(`/api/agent/scenario`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          supplyChainId: selectedSupplyChainId,
          customPrompt: customPrompt,
          scenarioCount: scenarioCount,
          timeHorizon: 90,
          focusType: 'ALL',
          includeHistorical: true,
          forceRefresh: true
        }),
      })
      
      const data = await response.json()
      const endTime = Date.now()
      const customProcessingTime = endTime - startTime
      
      if (!response.ok) {
        throw new Error(data.details || data.error || 'Failed to generate custom scenarios')
      }
      
      console.log('✅ Custom Scenario API Response:', data)
      
      if (data.success && data.scenarios && Array.isArray(data.scenarios)) {
        // Transform and add custom scenarios to existing ones
        const transformedScenarios: ScenarioData[] = data.scenarios.map((scenario: any) => ({
          scenarioName: scenario.scenarioName || '',
          scenarioType: mapScenarioType(scenario.scenarioType || 'DISRUPTION'),
          disruptionSeverity: Number(scenario.disruptionSeverity) || 0,
          disruptionDuration: Number(scenario.disruptionDuration) || 0,
          affectedNode: scenario.affectedNode || '',
          description: scenario.description || '',
          startDate: scenario.startDate || new Date().toISOString(),
          endDate: scenario.endDate || new Date().toISOString(),
          monteCarloRuns: Number(scenario.monteCarloRuns) || 10000,
          distributionType: scenario.distributionType || 'normal',
          cascadeEnabled: Boolean(scenario.cascadeEnabled),
          failureThreshold: Number(scenario.failureThreshold) || 0.3,
          bufferPercent: Number(scenario.bufferPercent) || 15,
          alternateRouting: Boolean(scenario.alternateRouting),
          randomSeed: scenario.randomSeed || `custom-seed-${Date.now()}`
        }))
        
        console.log(`🎨 Generated ${transformedScenarios.length} custom scenarios`)
        
        // Add custom scenarios to the top of the list
        setScenarios(prev => [...transformedScenarios, ...prev])
        setCustomPrompt("")
        
        // Update cache with new scenarios
        const currentCache = scenarioCache.get(selectedSupplyChainId) || []
        scenarioCache.set(selectedSupplyChainId, [...transformedScenarios, ...currentCache])
        
        toast({
          title: "Custom Scenarios Generated",
          description: `${transformedScenarios.length} custom scenarios created in ${Math.round(customProcessingTime / 1000)}s`,
        })
      } else {
        throw new Error('No scenarios returned from API')
      }
    } catch (error) {
      console.error('❌ Error generating custom scenarios:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate custom scenarios",
        variant: "destructive"
      })
    } finally {
      setIsGeneratingCustom(false)
    }
  }
  
  // Handle scenario selection properly
  const handleSelectScenario = (scenario: ScenarioData) => {
    // Update the global scenario context first
    updateScenarioData(scenario);
    
    // Then call the parent component's onSelectScenario handler
    onSelectScenario(scenario);
    
    // Close the sheet
    onOpenChange(false);
  };
  
  // Function to get appropriate icon based on scenario type
  const getScenarioIcon = (type: string) => {
    switch (type) {
      case "disruption":
        return <AlertTriangle className="h-5 w-5 text-orange-500" />
      case "natural":
        return <CloudLightning className="h-5 w-5 text-blue-500" />
      case "political":
        return <Briefcase className="h-5 w-5 text-purple-500" />
      case "demand":
        return <ShoppingCart className="h-5 w-5 text-green-500" />
      default:
        return <Building className="h-5 w-5 text-gray-500" />
    }
  }

  // Function to get severity badge color
  const getSeverityColor = (severity: number): "default" | "destructive" | "outline" | "secondary" => {
    if (severity >= 80) return "destructive"
    if (severity >= 60) return "secondary"
    if (severity >= 40) return "outline"
    return "default"
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md md:max-w-lg lg:max-w-xl overflow-y-auto">
        <SheetHeader>
          <div className="flex justify-between items-center">
            <SheetTitle className="flex items-center">
              <Sparkles className="h-5 w-5 mr-2 text-black dark:text-white" />
              AI Scenario Suggestions
              {fromCache && (
                <Badge variant="secondary" className="ml-2">
                  <Clock className="h-3 w-3 mr-1" />
                  Cached
                </Badge>
              )}
            </SheetTitle>
            
            <div className="flex items-center gap-2">
              {processingTime && (
                <Badge variant="outline" className="text-xs">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {Math.round(processingTime / 1000)}s
                </Badge>
              )}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleRefresh} 
                disabled={isLoading}
                title="Refresh scenarios"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
          <SheetDescription className="space-y-2">
            <span className="block">
              Choose from AI-generated scenarios based on your supply chain data and real-world intelligence, or create custom scenarios.
            </span>
            {selectedSupplyChainId && (
              <span className="text-xs text-muted-foreground block">
                Supply Chain: {selectedSupplyChainId.substring(0, 8)}...
              </span>
            )}
          </SheetDescription>
        </SheetHeader>

        {/* Custom Scenario Generator Section */}
        <div className="mt-8 p-6 border rounded-lg bg-white dark:bg-black border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-black dark:text-white" />
            <h3 className="font-semibold text-lg">Generate Custom Scenario</h3>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="custom-prompt" className="text-sm font-medium">
                Describe your scenario
              </Label>
              <Textarea
                id="custom-prompt"
                placeholder="E.g., 'A major earthquake hits our main supplier region in Japan, affecting automotive parts production for 2 weeks...'"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                className="min-h-[80px] resize-none"
                disabled={isGeneratingCustom}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scenario-count" className="text-sm font-medium">
                  Number of scenarios
                </Label>
                <Input
                  id="scenario-count"
                  type="number"
                  min="3"
                  max="5"
                  value={scenarioCount}
                  onChange={(e) => setScenarioCount(Number(e.target.value))}
                  className="mt-1"
                  disabled={isGeneratingCustom}
                />
              </div>
              
              <div className="flex items-end">
                <Button
                  onClick={generateCustomScenario}
                  disabled={isGeneratingCustom || !customPrompt.trim()}
                  className="w-full"
                  size="sm"
                >
                  {isGeneratingCustom ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Generate
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Search Bar for Scenarios */}
        {scenarios.length > 0 && (
          <div className="mb-8 space-y-3">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Search Scenarios</span>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search scenarios by name, description, or affected node..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearSearch}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            {searchQuery && (
              <div className="mt-2 text-sm text-muted-foreground">
                {filteredScenarios.length === 0 
                  ? `No scenarios match "${searchQuery}"`
                  : `Found ${filteredScenarios.length} of ${scenarios.length} scenarios`
                }
              </div>
            )}
          </div>
        )}

        {/* Recommended Scenarios Section */}
        <div>
          <h3 className="font-semibold mb-4 flex items-center">
            <Sparkles className="h-4 w-4 mr-2" />
            Recommended Scenarios
            {scenarios.length > 0 && (
              <Badge variant="outline" className="ml-2 text-xs">
                {filteredScenarios.length}
              </Badge>
            )}
          </h3>
          
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-2 text-sm text-muted-foreground">Generating AI scenarios...</p>
            </div>
          ) : scenarios.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <AlertTriangle className="h-8 w-8 text-amber-500 mb-2" />
              <p className="text-sm text-muted-foreground">
                No scenarios available. Please ensure you have supply chain data and try refreshing.
              </p>
            </div>
          ) : filteredScenarios.length === 0 && searchQuery ? (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <Search className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                No scenarios match your search criteria.
              </p>
              <Button variant="ghost" size="sm" onClick={clearSearch} className="mt-2">
                Clear search
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredScenarios.map((scenario, index) => (
                <Card key={index} className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-black transition-all hover:border-slate-400 dark:hover:border-slate-600 hover:shadow-sm">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        {getScenarioIcon(scenario.scenarioType)}
                        <CardTitle className="text-lg ml-2">{scenario.scenarioName}</CardTitle>
                      </div>
                      <Badge variant={getSeverityColor(scenario.disruptionSeverity)}>
                        {scenario.disruptionSeverity}% Severity
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-2 mt-1">
                      {scenario.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2 text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Duration: {scenario.disruptionDuration} days</span>
                      <span>Affected: {scenario.affectedNode.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => handleSelectScenario(scenario)}
                    >
                      Apply This Scenario <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}