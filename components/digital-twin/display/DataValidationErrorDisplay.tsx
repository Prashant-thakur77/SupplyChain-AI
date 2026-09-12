"use client";

import { FC } from 'react';
import { AlertTriangle, ArrowLeft, RefreshCw, XCircle, AlertCircle, FileX, Bug, Database, Network } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DataValidationError {
  type: 'missing_data' | 'invalid_nodes' | 'invalid_edges' | 'missing_positions' | 'invalid_references' | 'malformed_data'
  message: string
  details?: string[]
  count?: number
}

interface DataValidationErrorDisplayProps {
  errors: DataValidationError[]
  onRetry: () => void
  onGoBack: () => void
}

const DataValidationErrorDisplay: FC<DataValidationErrorDisplayProps> = ({ 
  errors, 
  onRetry, 
  onGoBack 
}) => {
  const getErrorIcon = (type: DataValidationError['type']) => {
    switch (type) {
      case 'missing_data': return <FileX className="w-4 h-4" />
      case 'invalid_nodes': return <Database className="w-4 h-4" />
      case 'invalid_edges': return <Network className="w-4 h-4" />
      case 'missing_positions': return <AlertCircle className="w-4 h-4" />
      case 'invalid_references': return <XCircle className="w-4 h-4" />
      case 'malformed_data': return <Bug className="w-4 h-4" />
      default: return <AlertTriangle className="w-4 h-4" />
    }
  }

  const getErrorColors = (type: DataValidationError['type']) => {
    switch (type) {
      case 'missing_data':
      case 'malformed_data':
        return { border: 'border-l-red-500', icon: 'text-red-600', badge: 'bg-red-100 text-red-800' }
      case 'invalid_nodes':
      case 'invalid_edges':
        return { border: 'border-l-orange-500', icon: 'text-orange-600', badge: 'bg-orange-100 text-orange-800' }
      default:
        return { border: 'border-l-yellow-500', icon: 'text-yellow-600', badge: 'bg-yellow-100 text-yellow-800' }
    }
  }

  const totalIssues = errors.reduce((sum, error) => sum + (error.count || 1), 0)
  const criticalErrors = errors.filter(e => ['missing_data', 'malformed_data'].includes(e.type)).length
  const highErrors = errors.filter(e => ['invalid_nodes', 'invalid_edges'].includes(e.type)).length

  return (
    <div className="min-h-full flex-1 flex items-center justify-center p-4">
      <Card className="shadow-md max-w-2xl w-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Data Validation Failed</CardTitle>
                <p className="text-sm text-muted-foreground">Supply chain data has structural issues</p>
              </div>
            </div>
            <Badge variant="destructive">{errors.length} errors</Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-2 rounded bg-red-50">
              <div className="text-lg font-bold text-red-600">{criticalErrors}</div>
              <div className="text-xs text-muted-foreground">Critical</div>
            </div>
            <div className="p-2 rounded bg-orange-50">
              <div className="text-lg font-bold text-orange-600">{highErrors}</div>
              <div className="text-xs text-muted-foreground">High Priority</div>
            </div>
            <div className="p-2 rounded bg-blue-50">
              <div className="text-lg font-bold text-blue-600">{totalIssues}</div>
              <div className="text-xs text-muted-foreground">Total Issues</div>
            </div>
          </div>

          {/* Error List */}
          <ScrollArea className="h-48">
            <div className="space-y-2">
              {errors.map((error, index) => {
                const colors = getErrorColors(error.type)
                return (
                  <div key={index} className={`p-3 border-l-2 ${colors.border} bg-muted/30 rounded-r`}>
                    <div className="flex items-start gap-2">
                      <div className={colors.icon}>{getErrorIcon(error.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium">{error.message}</p>
                          <Badge className={`text-xs ${colors.badge}`}>
                            {error.type.replace('_', ' ').toUpperCase()}
                          </Badge>
                          {error.count && (
                            <Badge variant="secondary" className="text-xs">{error.count} issues</Badge>
                          )}
                        </div>
                        {error.details && error.details.length > 0 && (
                          <div className="text-xs text-muted-foreground">
                            <div className="max-h-16 overflow-y-auto">
                              {error.details.slice(0, 3).map((detail, idx) => (
                                <div key={idx}>• {detail}</div>
                              ))}
                              {error.details.length > 3 && (
                                <div>+ {error.details.length - 3} more</div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button onClick={onRetry} className="flex-1 gap-2" size="sm">
              <RefreshCw className="w-3 h-3" />
              Retry Loading
            </Button>
            <Button onClick={onGoBack} variant="outline" className="flex-1 gap-2" size="sm">
              <ArrowLeft className="w-3 h-3" />
              Go Back to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default DataValidationErrorDisplay 