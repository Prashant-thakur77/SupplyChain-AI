"use client"

import { useState } from "react"
import { 
  Sparkles, 
  FileText, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  Zap, 
  Building, 
  Globe, 
  Factory, 
  Truck, 
  ShoppingCart, 
  Plus, 
  ChevronRight,
  Search,
  Shield,
  BarChart3
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { ScenarioData } from "@/lib/context/scenario-context"
import { ForecastScenarios } from "./forecast-scenarios"

function MinimalCard({ 
  children, 
  className = "", 
  hover = true,
  ...props 
}: { 
  children: React.ReactNode
  className?: string
  hover?: boolean
  [key: string]: any 
}) {
  return (
    <Card 
      className={cn(
        "border border-theme-border-subtle bg-theme-bg-surface text-theme-text-primary shadow-sm rounded-theme-lg transition-all duration-300 relative overflow-hidden",
        hover && "hover:-translate-y-1.5 hover:shadow-md hover:border-t-2 hover:border-t-theme-blue cursor-pointer",
        className
      )} 
      {...props}
    >
      {children}
    </Card>
  )
}

interface ScenarioTemplate {
  id: string
  name: string
  description: string
  category: 'popular' | 'industry' | 'advanced' | 'forecast'
  icon: React.ComponentType<{ className?: string }>
  severity: 'low' | 'medium' | 'high' | 'critical'
  duration: string
  complexity: 'simple' | 'moderate' | 'complex'
  tags: string[]
  scenarioData: ScenarioData
  isRecommended?: boolean
  popularity?: number
}

const scenarioTemplates: ScenarioTemplate[] = [
  {
    id: 'supplier-disruption',
    name: 'Supplier Disruption',
    description: 'Analyze impact when a key supplier faces operational issues or closure',
    category: 'popular',
    icon: Factory,
    severity: 'high',
    duration: '2-4 weeks',
    complexity: 'simple',
    tags: ['Supplier Risk', 'Single Point of Failure', 'Quick Analysis'],
    isRecommended: true,
    popularity: 95,
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
    category: 'popular',
    icon: AlertTriangle,
    severity: 'critical',
    duration: '1-3 months',
    complexity: 'moderate',
    tags: ['Natural Disaster', 'Geographic Risk', 'Extended Impact'],
    isRecommended: true,
    popularity: 88,
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
    category: 'popular',
    icon: TrendingUp,
    severity: 'medium',
    duration: '2-8 weeks',
    complexity: 'simple',
    tags: ['Demand Planning', 'Capacity Stress', 'Market Response'],
    popularity: 82,
    scenarioData: {
      scenarioName: 'Unexpected Demand Surge',
      scenarioType: 'demand',
      description: 'Sudden 300% increase in demand due to viral marketing or competitor shortage',
      disruptionSeverity: 60,
      disruptionDuration: 21,
      affectedNode: 'factory-main,distribution-center',
      startDate: '',
      endDate: '',
      monteCarloRuns: 800,
      distributionType: 'normal',
      cascadeEnabled: false,
      failureThreshold: 70,
      bufferPercent: 10,
      alternateRouting: false,
      randomSeed: ''
    }
  },
  {
    id: 'transportation-crisis',
    name: 'Transportation Crisis',
    description: 'Evaluate impact of shipping delays, port strikes, or logistics disruptions',
    category: 'popular',
    icon: Truck,
    severity: 'medium',
    duration: '1-6 weeks',
    complexity: 'moderate',
    tags: ['Logistics', 'Transportation', 'Infrastructure'],
    popularity: 76,
    scenarioData: {
      scenarioName: 'Major Transportation Disruption',
      scenarioType: 'disruption',
      description: 'Port strike or transportation network failure affecting delivery schedules',
      disruptionSeverity: 70,
      disruptionDuration: 28,
      affectedNode: 'warehouse-central,distribution-center',
      startDate: '',
      endDate: '',
      monteCarloRuns: 1200,
      distributionType: 'normal',
      cascadeEnabled: true,
      failureThreshold: 60,
      bufferPercent: 25,
      alternateRouting: true,
      randomSeed: ''
    }
  },
  {
    id: 'geopolitical-event',
    name: 'Geopolitical Event',
    description: 'Analyze impact of trade wars, sanctions, or political instability',
    category: 'advanced',
    icon: Globe,
    severity: 'critical',
    duration: '3-12 months',
    complexity: 'complex',
    tags: ['Political Risk', 'Trade Policy', 'Long-term Impact'],
    popularity: 69,
    scenarioData: {
      scenarioName: 'Geopolitical Trade Disruption',
      scenarioType: 'political',
      description: 'Trade restrictions or sanctions affecting international supply routes',
      disruptionSeverity: 90,
      disruptionDuration: 120,
      affectedNode: 'supplier-a,supplier-b',
      startDate: '',
      endDate: '',
      monteCarloRuns: 2000,
      distributionType: 'normal',
      cascadeEnabled: true,
      failureThreshold: 30,
      bufferPercent: 30,
      alternateRouting: true,
      randomSeed: ''
    }
  },
  {
    id: 'cyber-attack',
    name: 'Cyber Security Incident',
    description: 'Simulate impact of ransomware, data breaches, or system failures',
    category: 'advanced',
    icon: Zap,
    severity: 'critical',
    duration: '1-4 weeks',
    complexity: 'complex',
    tags: ['Cybersecurity', 'Digital Risk', 'Operations Halt'],
    popularity: 71,
    scenarioData: {
      scenarioName: 'Critical System Cyber Attack',
      scenarioType: 'disruption',
      description: 'Ransomware attack compromising production systems and data integrity',
      disruptionSeverity: 95,
      disruptionDuration: 14,
      affectedNode: 'factory-main,warehouse-central',
      startDate: '',
      endDate: '',
      monteCarloRuns: 1000,
      distributionType: 'normal',
      cascadeEnabled: true,
      failureThreshold: 20,
      bufferPercent: 40,
      alternateRouting: false,
      randomSeed: ''
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
    popularity: 63,
    scenarioData: {
      scenarioName: 'Critical Component Recall',
      scenarioType: 'disruption',
      description: 'Safety recall requiring immediate halt of production and component replacement',
      disruptionSeverity: 80,
      disruptionDuration: 35,
      affectedNode: 'factory-main,supplier-a',
      startDate: '',
      endDate: '',
      monteCarloRuns: 1200,
      distributionType: 'normal',
      cascadeEnabled: true,
      failureThreshold: 45,
      bufferPercent: 20,
      alternateRouting: true,
      randomSeed: ''
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
    popularity: 58,
    scenarioData: {
      scenarioName: 'Holiday Season Peak Demand',
      scenarioType: 'demand',
      description: 'Black Friday and holiday season surge with 400% demand increase',
      disruptionSeverity: 50,
      disruptionDuration: 56,
      affectedNode: 'distribution-center,retail-outlet',
      startDate: '',
      endDate: '',
      monteCarloRuns: 800,
      distributionType: 'normal',
      cascadeEnabled: false,
      failureThreshold: 80,
      bufferPercent: 5,
      alternateRouting: false,
      randomSeed: ''
    }
  }
]

interface ProfessionalTemplateSelectionProps {
  onTemplateSelect: (template: ScenarioTemplate | null) => void
  onStartFromScratch: () => void
  onAIScenarios: () => void
  onSelectScenario: (scenario: ScenarioData) => void
}

export function ProfessionalTemplateSelection({ 
  onTemplateSelect, 
  onStartFromScratch,
  onAIScenarios,
  onSelectScenario 
}: ProfessionalTemplateSelectionProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-[#3B7A57]/10 text-[#3B7A57] border border-[#3B7A57]/20 font-bold'
      case 'medium': return 'bg-[#E6AD12]/10 text-[#E6AD12] border border-[#E6AD12]/20 font-bold'
      case 'high': return 'bg-[#D95D39]/10 text-[#D95D39] border border-[#D95D39]/20 font-bold'
      case 'critical': return 'bg-[#D95D39]/20 text-[#D95D39] border border-[#D95D39]/30 font-bold'
      default: return 'bg-[#A09A94]/10 text-[#6B6560] border border-[#E8E3DC] font-bold'
    }
  }

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simple': return 'bg-[#2B4FE8]/10 text-[#2B4FE8] border border-[#2B4FE8]/20 font-bold'
      case 'moderate': return 'bg-[#9A348E]/10 text-[#9A348E] border border-[#9A348E]/20 font-bold'
      case 'complex': return 'bg-[#4B0082]/10 text-[#4B0082] border border-[#4B0082]/20 font-bold'
      default: return 'bg-[#A09A94]/10 text-[#6B6560] border border-[#E8E3DC] font-bold'
    }
  }

  const filteredTemplates = scenarioTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    // Risk-based filtering logic
    let matchesCategory = true
    if (selectedCategory === "high-risk") {
      matchesCategory = template.severity === 'high' || template.severity === 'critical'
    } else if (selectedCategory === "moderate-risk") {
      matchesCategory = template.severity === 'medium'
    } else if (selectedCategory === "low-risk") {
      matchesCategory = template.severity === 'low'
    } else if (selectedCategory === "operational") {
      matchesCategory = template.tags.some(tag => 
        ['operational', 'supply shortage', 'demand surge', 'logistics'].includes(tag.toLowerCase())
      )
    } else if (selectedCategory === "external") {
      matchesCategory = template.tags.some(tag => 
        ['natural disaster', 'geopolitical', 'regulatory', 'economic'].includes(tag.toLowerCase())
      )
    }
    // "all" category shows everything
    
    return matchesSearch && matchesCategory
  })

  const groupedTemplates = {
    recommended: filteredTemplates.filter(t => t.isRecommended),
    highRisk: filteredTemplates.filter(t => (t.severity === 'high' || t.severity === 'critical') && !t.isRecommended),
    moderateRisk: filteredTemplates.filter(t => t.severity === 'medium'),
    operational: filteredTemplates.filter(t => t.tags.some(tag => 
      ['operational', 'supply shortage', 'demand surge', 'logistics'].includes(tag.toLowerCase())
    ))
  }

  return (
    <div className="space-y-10">
      {/* Two Action Cards — AI Scenarios + Custom Scenario */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <MinimalCard className="group transition-all duration-300" onClick={onAIScenarios}>
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-14 h-14 bg-theme-blue-soft border border-theme-blue/10 rounded-theme-md flex items-center justify-center mb-3 group-hover:bg-theme-blue group-hover:border-theme-blue transition-all duration-300 shadow-sm">
              <Sparkles className="w-6 h-6 text-theme-blue group-hover:text-white transition-colors duration-300" />
            </div>
            <CardTitle className="text-lg font-semibold text-theme-text-primary">AI Vector Generator</CardTitle>
            <CardDescription className="text-sm text-theme-text-secondary">
              Generate intelligent fault scenarios tailored to your network topology using AI.
            </CardDescription>
          </CardHeader>
        </MinimalCard>

        <MinimalCard className="group transition-all duration-300" onClick={onStartFromScratch}>
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-14 h-14 bg-theme-blue-soft border border-theme-blue/10 rounded-theme-md flex items-center justify-center mb-3 group-hover:bg-theme-blue group-hover:border-theme-blue transition-all duration-300 shadow-sm">
              <Plus className="w-6 h-6 text-theme-blue group-hover:text-white transition-colors duration-300" />
            </div>
            <CardTitle className="text-lg font-semibold text-theme-text-primary">Custom Scenario</CardTitle>
            <CardDescription className="text-sm text-theme-text-secondary">
              Define your own fault vector from scratch — choose affected nodes, severity, and cascade logic.
            </CardDescription>
          </CardHeader>
        </MinimalCard>
      </div>

      {/* Forecast Scenarios Section */}
      <div className="space-y-4">
        <ForecastScenarios onSelectScenario={onSelectScenario} />
      </div>
    </div>
  )
}

interface TemplateCardProps {
  template: ScenarioTemplate
  onSelect: () => void
  getSeverityColor: (severity: string) => string
  getComplexityColor: (complexity: string) => string
  isRecommended?: boolean
}

function TemplateCard({ 
  template, 
  onSelect, 
  getSeverityColor, 
  getComplexityColor, 
  isRecommended 
}: TemplateCardProps) {
  const Icon = template.icon

  return (
    <MinimalCard className="group relative" onClick={onSelect}>
      {isRecommended && (
        <div className="absolute -top-2 -right-2 z-10">
          <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
            ⭐ Recommended
          </div>
        </div>
      )}
      
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <Icon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </div>
            <div>
              <CardTitle className="text-base leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {template.name}
              </CardTitle>
              {template.popularity && (
                <div className="text-xs text-muted-foreground mt-1">
                  {template.popularity}% adoption rate
                </div>
              )}
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {template.description}
        </p>

        <div className="flex flex-wrap gap-2">
          <Badge className={getSeverityColor(template.severity)} variant="secondary">
            {template.severity} risk
          </Badge>
          <Badge className={getComplexityColor(template.complexity)} variant="secondary">
            {template.complexity}
          </Badge>
          <Badge variant="outline" className="text-xs">
            <Clock className="w-3 h-3 mr-1" />
            {template.duration}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-1">
          {template.tags.slice(0, 3).map((tag, index) => (
            <Badge key={index} variant="outline" className="text-xs bg-slate-50 dark:bg-slate-800/50">
              {tag}
            </Badge>
          ))}
          {template.tags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{template.tags.length - 3} more
            </Badge>
          )}
        </div>
      </CardContent>
    </MinimalCard>
  )
}
