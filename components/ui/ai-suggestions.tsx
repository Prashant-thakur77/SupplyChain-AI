"use client"

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Lightbulb, Loader2, RefreshCw, X } from 'lucide-react'
import { toast } from 'sonner'

interface AISuggestion {
  id: string
  title: string
  description: string
  action: string
  confidence: number
  category: 'optimization' | 'risk' | 'efficiency' | 'cost' | 'planning'
}

interface AISuggestionsProps {
  context?: any // Current page/component context
  trigger?: string // What triggered the suggestions
  onApplySuggestion?: (suggestion: AISuggestion) => void
  className?: string
  isVisible?: boolean // External control of visibility
  onVisibilityChange?: (visible: boolean) => void
}

export function AISuggestions({ 
  context, 
  trigger = 'auto',
  onApplySuggestion,
  className,
  isVisible: externalIsVisible,
  onVisibilityChange
}: AISuggestionsProps) {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [internalIsVisible, setInternalIsVisible] = useState(false)
  
  // Use external visibility control if provided, otherwise use internal state
  const isVisible = externalIsVisible !== undefined ? externalIsVisible : internalIsVisible
  const setIsVisible = (visible: boolean) => {
    if (externalIsVisible !== undefined) {
      onVisibilityChange?.(visible)
    } else {
      setInternalIsVisible(visible)
    }
  }

  const generateSuggestions = useCallback(async () => {
    if (!context) return

    setIsLoading(true)
    try {
      const prompt = `Based on the current supply chain context: ${JSON.stringify(context)}, 
        provide 3-5 actionable suggestions to improve efficiency, reduce risks, or optimize operations.
        
        Return suggestions in this exact JSON format:
        {
          "suggestions": [
            {
              "id": "unique-id",
              "title": "Short suggestion title",
              "description": "Detailed explanation",
              "action": "Specific action to take",
              "confidence": 85,
              "category": "optimization"
            }
          ]
        }`

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'user', content: prompt }
          ]
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to generate suggestions')
      }

      // Parse the direct JSON response (no streaming)
      const data = await response.json()
      
      // Handle the new response format that returns suggestions directly
      if (data.suggestions) {
        console.log('✅ AI Suggestions: Received suggestions:', data.suggestions)
        setSuggestions(data.suggestions)
        setIsVisible(true)
      } else {
        console.warn('⚠️ AI Suggestions: No suggestions found in response:', data)
        setSuggestions([])
      }
    } catch (error) {
      console.error('Error generating suggestions:', error)
      toast.error('Failed to generate AI suggestions')
    } finally {
      setIsLoading(false)
    }
  }, [context])

  // Auto-generate suggestions when context changes
  useEffect(() => {
    if (trigger === 'auto' && context) {
      const debounceTimer = setTimeout(generateSuggestions, 2000)
      return () => clearTimeout(debounceTimer)
    }
  }, [context, trigger, generateSuggestions])

  const handleApplySuggestion = (suggestion: AISuggestion) => {
    onApplySuggestion?.(suggestion)
    toast.success(`Applied suggestion: ${suggestion.title}`)
    // Auto-hide after applying suggestion
    setIsVisible(false)
  }

  const handleDismiss = () => {
    setIsVisible(false)
    setSuggestions([])
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      optimization: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
      risk: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100',
      efficiency: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100',
      cost: 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100',
      planning: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
    }
    return colors[category as keyof typeof colors] || colors.optimization
  }

  if (!isVisible && !isLoading) return null

  return (
    <div className={`w-full ${className}`}>
      {/* Header with controls */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-3 w-3 text-primary" />
          <span className="text-xs font-medium text-muted-foreground">AI Suggestions</span>
          {isLoading && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={generateSuggestions}
            disabled={isLoading}
            className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
            title="Refresh suggestions"
          >
            <RefreshCw className={`h-2.5 w-2.5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
            title="Hide suggestions"
          >
            <X className="h-2.5 w-2.5" />
          </Button>
        </div>
      </div>

      {/* Suggestions as Pills */}
      <div className="flex flex-wrap gap-1.5">
        {isLoading ? (
          <div className="text-xs text-muted-foreground px-3 py-1.5 bg-muted/50 rounded-full">
            Generating...
          </div>
        ) : (
          suggestions.map((suggestion) => (
            <Button
              key={suggestion.id}
              variant="outline"
              size="sm"
              onClick={() => handleApplySuggestion(suggestion)}
              className={`
                h-7 px-3 py-1 rounded-full text-xs font-medium
                hover:scale-105 transition-all duration-200
                ${getCategoryColor(suggestion.category)}
                flex items-center gap-1.5 whitespace-nowrap
              `}
              title={`${suggestion.description} (${suggestion.confidence}% confidence)`}
            >
              <span>{suggestion.title}</span>
              <Badge 
                variant="secondary"
                className="text-xs px-1 py-0 h-3 min-w-0 bg-white/50"
              >
                {suggestion.confidence}%
              </Badge>
            </Button>
          ))
        )}
      </div>
    </div>
  )
} 