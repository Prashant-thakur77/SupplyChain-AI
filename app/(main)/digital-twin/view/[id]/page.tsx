'use client'

import DigitalTwinSkeleton from '@/components/digital-twin/display/DigitalTwinViewSkeleton'
import { useParams } from 'next/navigation'
import { useSupplyChainView } from '@/lib/hooks/useSupplyChainView'
import { AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent }  from '@/components/ui/card'
import { motion } from 'framer-motion'
import DigitalTwinCanvas from '@/components/digital-twin/canvas/digital-twin-canvas'
import { ViewModeHeader, ReadOnlyRightPanel, ViewModeAIChatPanel } from '@/components/digital-twin/layout/view-mode'
import { ReactFlowProvider } from 'reactflow'
import React, { Component, ReactNode } from 'react'
import DataValidationErrorDisplay from '@/components/digital-twin/display/DataValidationErrorDisplay'
import DigitalTwinViewSkeleton from '@/components/digital-twin/display/DigitalTwinViewSkeleton'
import {
  DataValidationError,
  validateSupplyChainData,
} from './utils/validation'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }

    return this.props.children
  }
}

export default function DigitalTwinViewPage() {
  // `id` comes from dynamic route /digital-twin/view/[id]
  const params = useParams<{ id: string }>()
  const id = params?.id ?? null

  const { loading, error, arch } = useSupplyChainView(id)

  if (loading) {
    return <DigitalTwinViewSkeleton />
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-black p-4">
        <motion.div

          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="shadow-md border-0 bg-card/90 backdrop-blur-sm">
            <CardContent className="text-center p-8">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="mb-6"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
              </motion.div>
              
              <h2 className="text-xl font-semibold mb-3 text-foreground">
                Failed to Load Supply Chain
              </h2>
              
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                {error.message || 'An unexpected error occurred while loading the supply chain data.'}
              </p>
              
              <div className="space-y-3">
                <Button
                  onClick={() => window.location.reload()}
                  className="w-full gap-2"
                  variant="default"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </Button>
                
                <Button
                  onClick={() => history.back()}
                  variant="outline"
                  className="w-full gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Go Back
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground mt-6">
                If the problem persists, please contact support.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  if (!arch) {
    return <DigitalTwinSkeleton />
  }

  // Validate the loaded data
  const validationErrors = validateSupplyChainData(arch)
  
  if (validationErrors.length > 0) {
    return (
      <DataValidationErrorDisplay 
        errors={validationErrors}
        onRetry={() => window.location.reload()}
        onGoBack={() => history.back()}
      />
    )
  }

  // Render the full view-only workspace with the loaded data
  return (
    <ReactFlowProvider>
      <ErrorBoundary
        fallback={
          <DataValidationErrorDisplay 
            errors={[{
              type: 'malformed_data',
              message: 'Rendering error occurred',
              details: ['An unexpected error occurred while rendering the supply chain visualization']
            }]}
            onRetry={() => window.location.reload()}
            onGoBack={() => history.back()}
          />
        }
      >
        <div className="flex flex-col h-full flex-1">
          
          <div className="flex flex-1 overflow-hidden">
            {/* Left Panel - AI Chat (collapsible) */}
            <ViewModeAIChatPanel 
              nodes={arch.nodes}
              edges={arch.edges}
            />

            {/* Center - Digital Twin Canvas */}
            <div className="flex-1 relative">
              <DigitalTwinCanvas 
                initialNodes={arch.nodes}
                initialEdges={arch.edges}
                viewOnly={true}
              />
            </div>

            {/* Right Panel - Read-Only Inspector */}
            <ReadOnlyRightPanel />
          </div>
        </div>
      </ErrorBoundary>
    </ReactFlowProvider>
  )
} 