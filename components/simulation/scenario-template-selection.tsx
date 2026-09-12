"use client"

import { useState } from "react"
import { Sparkles, FileText, Clock, AlertTriangle, TrendingUp, Zap, Building, Globe, Factory, Truck, ShoppingCart, Plus, ChevronRight } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

// Glassmorphic Card Component
function GlassmorphicCard({ children, className = "", ...props }: { 
  children: React.ReactNode
  className?: string
  [key: string]: any 
}) {
  return (
    <Card 
      className={cn(
        "border border-white/30 dark:border-slate-700/10 bg-white/70 dark:bg-slate-950/50 backdrop-blur-xl shadow-xl shadow-black/5 dark:shadow-black/20 rounded-xl transition-all duration-300 hover:shadow-2xl hover:bg-white/80 dark:hover:bg-slate-950/70",
        className
      )} 
      {...props}
    >
      {children}
    </Card>
  )
}

import { ScenarioData } from "@/lib/context/scenario-context"

interface ScenarioTemplate {
  id: string
  name: string
  description: string
  category: 'common' | 'industry' | 'advanced'
  icon: React.ComponentType<{ className?: string }>
  severity: 'low' | 'medium' | 'high'
  duration: string
  complexity: 'simple' | 'moderate' | 'complex'
  tags: string[]
  scenarioData: ScenarioData
}

const scenarioTemplates: ScenarioTemplate[] = [
  {
    id: 'supplier-disruption',
    name: 'Supplier Disruption',
    description: 'Analyze impact when a key supplier faces operational issues or closure',
    category: 'common',
    icon: Factory,
    severity: 'high',
    duration: '2-4 weeks',
    complexity: 'simple',
    tags: ['Supplier Risk', 'Single Point of Failure', 'Quick Analysis'],
    scenarioData: {
      scenarioName: 'Key Supplier Disruption',
      scenarioType: 'disruption',
      description: 'A critical supplier experiences operational disruption affecting production capacity by 70-80%',
      disruptionSeverity: 75,
      disruptionDuration: 14,
      affectedNode: 'supplier-a',
      startDate: '',
      endDate: '',
      monteCarloRuns: 1000,
      distributionType: 'normal',
      cascadeEnabled: true,
      failureThreshold: 50,
      bufferPercent: 15,
      alternateRouting: true,
      randomSeed: ''
    }
  },
  {
    id: 'natural-disaster',
    name: 'Natural Disaster Impact',
    description: 'Simulate effects of earthquakes, floods, or severe weather on supply chain',
    category: 'common',
    icon: AlertTriangle,
    severity: 'high',
    duration: '1-3 months',
    complexity: 'moderate',
    tags: ['Natural Disaster', 'Geographic Risk', 'Extended Impact'],
    scenarioData: {
      scenarioName: 'Regional Natural Disaster',
      scenarioType: 'natural',
      description: 'Major natural disaster affecting multiple facilities and transportation routes in a region',
      disruptionSeverity: 85,
      disruptionDuration: 45,
      affectedNode: 'supplier-a,warehouse-central',
      startDate: '',
      endDate: '',
      monteCarloRuns: 1500,
      distributionType: 'normal',
      cascadeEnabled: true,
      failureThreshold: 40,
      bufferPercent: 20,
      alternateRouting: true,
      randomSeed: ''
    }
  },
  {
    id: 'demand-surge',
    name: 'Sudden Demand Surge',
    description: 'Test capacity when facing unexpected spike in customer demand',
    category: 'common',
    icon: TrendingUp,
    severity: 'medium',
    duration: '2-8 weeks',
    complexity: 'simple',
    tags: ['Demand Planning', 'Capacity Stress', 'Market Response'],
    scenarioData: {
        scenarioName: 'Unexpected Demand Surge',
        scenarioType: 'demand',
        description: 'Sudden 300% increase in demand due to viral marketing or competitor shortage',
        disruptionSeverity: 60,
        disruptionDuration: 21,
        affectedNode: 'factory-main,distribution-center',
        monteCarloRuns: 800,
        cascadeEnabled: false,
        failureThreshold: 70,
        bufferPercent: 10,
        alternateRouting: false,
        startDate: "",
        endDate: "",
        distributionType: "",
        randomSeed: ""
    }
  },
  {
    id: 'transportation-crisis',
    name: 'Transportation Crisis',
    description: 'Evaluate impact of shipping delays, port strikes, or logistics disruptions',
    category: 'common',
    icon: Truck,
    severity: 'medium',
    duration: '1-6 weeks',
    complexity: 'moderate',
    tags: ['Logistics', 'Transportation', 'Infrastructure'],
    scenarioData: {
        scenarioName: 'Major Transportation Disruption',
        scenarioType: 'disruption',
        description: 'Port strike or transportation network failure affecting delivery schedules',
        disruptionSeverity: 70,
        disruptionDuration: 28,
        affectedNode: 'warehouse-central,distribution-center',
        monteCarloRuns: 1200,
        cascadeEnabled: true,
        failureThreshold: 60,
        bufferPercent: 25,
        alternateRouting: true,
        startDate: "",
        endDate: "",
        distributionType: "",
        randomSeed: ""
    }
  },
  {
    id: 'geopolitical-event',
    name: 'Geopolitical Event',
    description: 'Analyze impact of trade wars, sanctions, or political instability',
    category: 'advanced',
    icon: Globe,
    severity: 'high',
    duration: '3-12 months',
    complexity: 'complex',
    tags: ['Political Risk', 'Trade Policy', 'Long-term Impact'],
    scenarioData: {
        scenarioName: 'Geopolitical Trade Disruption',
        scenarioType: 'political',
        description: 'Trade restrictions or sanctions affecting international supply routes',
        disruptionSeverity: 90,
        disruptionDuration: 120,
        affectedNode: 'supplier-a,supplier-b',
        monteCarloRuns: 2000,
        cascadeEnabled: true,
        failureThreshold: 30,
        bufferPercent: 30,
        alternateRouting: true,
        startDate: "",
        endDate: "",
        distributionType: "",
        randomSeed: ""
    }
  },
  {
    id: 'cyber-attack',
    name: 'Cyber Security Incident',
    description: 'Simulate impact of ransomware, data breaches, or system failures',
    category: 'advanced',
    icon: Zap,
    severity: 'high',
    duration: '1-4 weeks',
    complexity: 'complex',
    tags: ['Cybersecurity', 'Digital Risk', 'Operations Halt'],
    scenarioData: {
        scenarioName: 'Critical System Cyber Attack',
        scenarioType: 'disruption',
        description: 'Ransomware attack compromising production systems and data integrity',
        disruptionSeverity: 95,
        disruptionDuration: 14,
        affectedNode: 'factory-main,warehouse-central',
        monteCarloRuns: 1000,
        cascadeEnabled: true,
        failureThreshold: 20,
        bufferPercent: 40,
        alternateRouting: false,
        startDate: "",
        endDate: "",
        distributionType: "",
        randomSeed: ""
    }
  },
  {
    id: 'automotive-recall',
    name: 'Product Recall Crisis',
    description: 'Industry-specific: Automotive product recall affecting production',
    category: 'industry',
    icon: Building,
    severity: 'medium',
    duration: '4-8 weeks',
    complexity: 'moderate',
    tags: ['Automotive', 'Quality Issues', 'Regulatory'],
    scenarioData: {
        scenarioName: 'Critical Component Recall',
        scenarioType: 'disruption',
        description: 'Safety recall requiring immediate halt of production and component replacement',
        disruptionSeverity: 80,
        disruptionDuration: 35,
        affectedNode: 'factory-main,supplier-a',
        monteCarloRuns: 1200,
        cascadeEnabled: true,
        failureThreshold: 45,
        bufferPercent: 20,
        alternateRouting: true,
        startDate: "",
        endDate: "",
        distributionType: "",
        randomSeed: ""
    }
  },
  {
    id: 'retail-seasonal',
    name: 'Seasonal Demand Peak',
    description: 'Industry-specific: Retail holiday season capacity stress test',
    category: 'industry',
    icon: ShoppingCart,
    severity: 'medium',
    duration: '6-12 weeks',
    complexity: 'moderate',
    tags: ['Retail', 'Seasonal', 'Capacity Planning'],
    scenarioData: {
        scenarioName: 'Holiday Season Peak Demand',
        scenarioType: 'demand',
        description: 'Black Friday and holiday season surge with 400% demand increase',
        disruptionSeverity: 50,
        disruptionDuration: 56,
        affectedNode: 'distribution-center,retail-outlet',
        monteCarloRuns: 800,
        cascadeEnabled: false,
        failureThreshold: 80,
        bufferPercent: 5,
        alternateRouting: false,
        startDate: "",
        endDate: "",
        distributionType: "",
        randomSeed: ""
    }
  }
]

interface ScenarioTemplateSelectionProps {
  onTemplateSelect: (template: ScenarioTemplate | null) => void
  onStartFromScratch: () => void
}

export function ScenarioTemplateSelection({ 
  onTemplateSelect, 
  onStartFromScratch 
}: ScenarioTemplateSelectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'common' | 'industry' | 'advanced'>('all')
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)

  const filteredTemplates = selectedCategory === 'all' 
    ? scenarioTemplates 
    : scenarioTemplates.filter(t => t.category === selectedCategory)

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simple': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      case 'moderate': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
      case 'complex': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  const handleTemplateSelection = (template: ScenarioTemplate) => {
    setSelectedTemplate(template.id)
    onTemplateSelect(template)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
          Choose Your Scenario Template
        </h1>
        <p className="text-slate-600 dark:text-slate-300 text-lg max-w-2xl mx-auto">
          Select a pre-configured scenario template to get started quickly, or create a custom scenario from scratch
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex justify-center">
        <div className="flex items-center gap-2 p-1 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-xl border border-white/30 dark:border-slate-700/10">
          {[
            { key: 'all', label: 'All Templates' },
            { key: 'common', label: 'Common Scenarios' },
            { key: 'industry', label: 'Industry-Specific' },
            { key: 'advanced', label: 'Advanced' }
          ].map((cat) => (
            <Button
              key={cat.key}
              variant={selectedCategory === cat.key ? "default" : "ghost"}
              size="sm"
              onClick={() => setSelectedCategory(cat.key as any)}
              className={cn(
                "transition-all duration-200",
                selectedCategory === cat.key 
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg" 
                  : "hover:bg-white/50 dark:hover:bg-slate-800/50"
              )}
            >
              {cat.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => {
          const IconComponent = template.icon
          const isSelected = selectedTemplate === template.id
          
          return (
            <GlassmorphicCard 
              key={template.id}
              className={cn(
                "cursor-pointer group relative overflow-hidden",
                isSelected && "ring-2 ring-blue-500 ring-offset-2 ring-offset-transparent"
              )}
              onClick={() => handleTemplateSelection(template)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-indigo-500/10 dark:from-blue-400/10 dark:to-indigo-400/10">
                      <IconComponent className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {template.name}
                      </CardTitle>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                </div>
                <CardDescription className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {template.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className={cn("text-xs font-medium", getSeverityColor(template.severity))}>
                    {template.severity.toUpperCase()} RISK
                  </Badge>
                  <Badge variant="secondary" className={cn("text-xs font-medium", getComplexityColor(template.complexity))}>
                    {template.complexity.toUpperCase()}
                  </Badge>
                </div>

                {/* Duration */}
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <Clock className="h-4 w-4" />
                  <span>Duration: {template.duration}</span>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1">
                  {template.tags.slice(0, 2).map((tag) => (
                    <Badge 
                      key={tag} 
                      variant="outline" 
                      className="text-xs px-2 py-1 bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                    >
                      {tag}
                    </Badge>
                  ))}
                  {template.tags.length > 2 && (
                    <Badge 
                      variant="outline" 
                      className="text-xs px-2 py-1 bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                    >
                      +{template.tags.length - 2}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </GlassmorphicCard>
          )
        })}
      </div>

      <Separator className="my-8" />

      {/* Alternative Options */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-center text-slate-800 dark:text-slate-100">
          Or choose your preferred approach
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
          {/* AI Scenarios Option */}
          <GlassmorphicCard className="cursor-pointer group hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-6 text-center space-y-3">
              <div className="p-3 rounded-full bg-gradient-to-br from-purple-500/10 to-pink-500/10 dark:from-purple-400/10 dark:to-pink-400/10 w-fit mx-auto">
                <Sparkles className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h4 className="font-semibold text-lg text-slate-800 dark:text-slate-100">AI-Generated Scenarios</h4>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Let AI suggest scenarios based on your supply chain data and industry best practices
              </p>
              <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                Smart Recommendations
              </Badge>
            </CardContent>
          </GlassmorphicCard>

          {/* Custom Scenario Option */}
          <GlassmorphicCard 
            className="cursor-pointer group hover:shadow-2xl transition-all duration-300"
            onClick={onStartFromScratch}
          >
            <CardContent className="p-6 text-center space-y-3">
              <div className="p-3 rounded-full bg-gradient-to-br from-green-500/10 to-emerald-500/10 dark:from-green-400/10 dark:to-emerald-400/10 w-fit mx-auto">
                <Plus className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h4 className="font-semibold text-lg text-slate-800 dark:text-slate-100">Start from Scratch</h4>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Create a completely custom scenario with your own parameters and configurations
              </p>
              <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                Full Customization
              </Badge>
            </CardContent>
          </GlassmorphicCard>
        </div>
      </div>
    </div>
  )
}
