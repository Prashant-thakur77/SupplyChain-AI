import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { X, CheckCircle, Clock, Shield, AlertCircle, Star, Download, Send, FileText, Users, Calendar, DollarSign } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from 'sonner';

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

interface SelectedStrategySummary {
  immediate: ApiMitigationStrategy[]
  shortTerm: ApiMitigationStrategy[]
  longTerm: ApiMitigationStrategy[]
  totalCost: string
  totalImpact: string
  timelineSpan: string
  riskReduction: string
}

interface FinalizeStrategyPanelProps {
  selectedStrategies: SelectedStrategySummary
  open: boolean
  onClose: () => void
  onFinalize: (data: FinalizeData) => void
  isMobile?: boolean
  simulationId?: string
  roadmapOpen?: boolean
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

export const FinalizeStrategyPanel: React.FC<FinalizeStrategyPanelProps> = ({
  selectedStrategies,
  open,
  onClose,
  onFinalize,
  isMobile = false,
  simulationId,
  roadmapOpen = false
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const allStrategies = React.useMemo(() => [
    ...selectedStrategies.immediate,
    ...selectedStrategies.shortTerm,
    ...selectedStrategies.longTerm
  ], [selectedStrategies.immediate, selectedStrategies.shortTerm, selectedStrategies.longTerm])

  const handleFinalize = async () => {
    setIsSubmitting(true)
    
    try {
      const finalizeData: FinalizeData = {
        approvedStrategies: allStrategies.map(s => s.id), // Auto-approve all strategies
        implementationNotes: "Strategy finalized and ready for implementation",
        priorityAdjustments: [],
        stakeholderApproval: true,
        budgetConfirmed: true,
        resourcesAllocated: true,
        timelineAccepted: true
      }

      // Call the finalize API to start backend work
      if (simulationId) {
        const response = await fetch('/api/agent/strategy/finalize', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            simulationId,
            finalizeData
          })
        })

        if (response.ok) {
          toast.success('Strategy finalization initiated! Backend agents are now processing your implementation plan.')
        } else {
          throw new Error('Failed to initiate strategy finalization')
        }
      }

      onFinalize(finalizeData)
      onClose()
    } catch (error) {
      console.error('Error finalizing strategy:', error)
      toast.error('Failed to start strategy finalization. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const FinalizeContent = () => (
    <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
      {/* Summary Stats */}
      <div className="space-y-4">
        <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30 mx-auto">
          <CheckCircle className="h-8 w-8 text-white" />
        </div>
        
        <div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Ready to Finalize Strategy
          </h3>
          <p className="text-muted-foreground text-lg">
            Launch implementation with {allStrategies.length} mitigation strategies
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200/60 dark:border-blue-800/40">
            <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">Total Cost</p>
            <p className="text-xl font-bold text-blue-900 dark:text-blue-100">{selectedStrategies.totalCost}</p>
          </div>
          <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-xl border border-purple-200/60 dark:border-purple-800/40">
            <p className="text-sm font-semibold text-purple-800 dark:text-purple-200">Risk Reduction</p>
            <p className="text-xl font-bold text-purple-900 dark:text-purple-100">{selectedStrategies.riskReduction}</p>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <Button
        onClick={handleFinalize}
        disabled={isSubmitting}
        size="lg"
        className="w-full max-w-md h-14 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white text-lg font-semibold shadow-lg shadow-green-500/30 hover:shadow-green-500/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
      >
        {isSubmitting ? (
          <>
            <div className="w-5 h-5 animate-spin rounded-full border-2 border-current border-r-transparent mr-3" />
            Initiating Strategy Implementation...
          </>
        ) : (
          <>
            <Send className="w-5 h-5 mr-3" />
            Finalize & Execute Strategy
          </>
        )}
      </Button>

      <p className="text-sm text-muted-foreground max-w-md">
        This will start the automated implementation process with your backend agents handling resource allocation, timeline coordination, and stakeholder notifications.
      </p>
    </div>
  )

  // Panel content wrapper
  const content = (
    <motion.div
      initial={{ x: isMobile ? 0 : 80, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: isMobile ? 0 : 80, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="h-full flex flex-col"
    >
      <Card className="border border-white/40 dark:border-slate-700/30 bg-white/98 dark:bg-slate-900/98 backdrop-blur-xl shadow-2xl shadow-black/10 dark:shadow-black/40 rounded-2xl h-full flex flex-col overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between gap-4 p-8 pb-6 border-b border-white/30 dark:border-slate-700/30 bg-gradient-to-r from-green-50/70 to-emerald-50/50 dark:from-green-950/30 dark:to-emerald-950/20 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/30 border border-green-400/20">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">Finalize Strategy</CardTitle>
              <CardDescription className="text-sm text-muted-foreground mt-1">
                Review and onboard your mitigation strategy
              </CardDescription>
            </div>
          </div>
          {!isMobile && (
            <button 
              onClick={onClose} 
              className="p-3 rounded-xl hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all duration-200 hover:scale-105 flex-shrink-0"
              aria-label="Close finalize panel"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          )}
        </CardHeader>
        
        <CardContent className="flex-1 p-8 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
          <FinalizeContent />
        </CardContent>
      </Card>
    </motion.div>
  )

  // Mobile: Drawer, Desktop: Side panel
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onClose}>
        <DrawerContent className="max-h-[90vh] border-t border-gray-200/60 dark:border-gray-700/60">
          <DrawerHeader className="flex items-center justify-between p-8 border-b border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/30">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <DrawerTitle className="text-xl font-bold text-gray-900 dark:text-white">Finalize Strategy</DrawerTitle>
            </div>
            <DrawerClose asChild>
              <button 
                className="p-3 rounded-xl hover:bg-muted/60 transition-all duration-200"
                aria-label="Close finalize drawer"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </DrawerClose>
          </DrawerHeader>
          <div className="p-8 overflow-y-auto">
            <FinalizeContent />
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  // Desktop side panel
  if (!open) return null

  return (
    <div className="fixed right-0 top-[80px] h-[calc(100vh-80px)] w-[450px] z-[51] p-4 transition-transform duration-300 ease-in-out bg-transparent">
      {content}
    </div>
  )
}

export default FinalizeStrategyPanel
