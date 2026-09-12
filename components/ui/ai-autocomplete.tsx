"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Sparkles, ArrowUp, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AutocompleteSuggestion {
  id: string
  text: string
  description?: string
  type: 'completion' | 'suggestion' | 'command'
  confidence: number
}

interface AIAutocompleteProps {
  placeholder?: string
  onSubmit?: (value: string) => void
  onSuggestionSelect?: (suggestion: AutocompleteSuggestion) => void
  context?: any
  className?: string
}

export function AIAutocomplete({
  placeholder = "Ask anything...",
  onSubmit,
  onSuggestionSelect,
  context,
  className
}: AIAutocompleteProps) {
  const [value, setValue] = useState('')
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [recentQueries, setRecentQueries] = useState<string[]>([])
  
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionTimeout = useRef<NodeJS.Timeout | null>(null)

  // Load recent queries from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('ai-recent-queries')
    if (stored) {
      setRecentQueries(JSON.parse(stored))
    }
  }, [])

  const saveQuery = (query: string) => {
    const updated = [query, ...recentQueries.filter(q => q !== query)].slice(0, 10)
    setRecentQueries(updated)
    localStorage.setItem('ai-recent-queries', JSON.stringify(updated))
  }

  const generateSuggestions = useCallback(async (input: string) => {
    if (input.length < 2) {
      setSuggestions([])
      return
    }

    setIsLoading(true)
    try {
      const prompt = `Given the input "${input}" and context: ${JSON.stringify(context)}, 
        provide 3-5 intelligent completions and suggestions for supply chain queries.
        
        Return as JSON:
        {
          "suggestions": [
            {
              "id": "1",
              "text": "Complete text suggestion",
              "description": "Brief explanation",
              "type": "completion",
              "confidence": 85
            }
          ]
        }`

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }]
        })
      })

      if (response.ok) {
        const reader = response.body?.getReader()
        if (reader) {
          let fullResponse = ''
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            fullResponse += new TextDecoder().decode(value)
          }

          const jsonMatch = fullResponse.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            const data = JSON.parse(jsonMatch[0])
            setSuggestions(data.suggestions || [])
            setShowSuggestions(true)
          }
        }
      }
    } catch (error) {
      console.error('Error generating suggestions:', error)
    } finally {
      setIsLoading(false)
    }
  }, [context])

  const debouncedSuggestions = useCallback((input: string) => {
    if (suggestionTimeout.current) {
      clearTimeout(suggestionTimeout.current)
    }
    suggestionTimeout.current = setTimeout(() => {
      generateSuggestions(input)
    }, 300)
  }, [generateSuggestions])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setValue(newValue)
    
    if (newValue.trim()) {
      debouncedSuggestions(newValue)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
    setSelectedIndex(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => Math.max(prev - 1, -1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0) {
          handleSuggestionSelect(suggestions[selectedIndex])
        } else if (value.trim()) {
          handleSubmit()
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setSelectedIndex(-1)
        break
      case 'Tab':
        if (selectedIndex >= 0) {
          e.preventDefault()
          handleSuggestionSelect(suggestions[selectedIndex])
        }
        break
    }
  }

  const handleSuggestionSelect = (suggestion: AutocompleteSuggestion) => {
    setValue(suggestion.text)
    setShowSuggestions(false)
    setSelectedIndex(-1)
    onSuggestionSelect?.(suggestion)
    inputRef.current?.focus()
  }

  const handleSubmit = () => {
    if (!value.trim()) return
    
    saveQuery(value)
    onSubmit?.(value)
    setValue('')
    setShowSuggestions(false)
  }

  const showRecentQueries = !value && recentQueries.length > 0

  return (
    <div className={cn("relative w-full", className)}>
      <div className="relative">
        <Input
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="pr-10"
          onFocus={() => {
            if (suggestions.length > 0 || showRecentQueries) {
              setShowSuggestions(true)
            }
          }}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {isLoading && (
            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={handleSubmit}
            disabled={!value.trim()}
            className="h-6 w-6 p-0"
          >
            <ArrowUp className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {(showSuggestions || showRecentQueries) && (
        <div className="absolute top-full mt-2 w-full z-50">
          {showRecentQueries ? (
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground flex items-center gap-1 px-1">
                <Clock className="h-3 w-3" />
                Recent queries
              </div>
              <div className="flex flex-wrap gap-1.5">
                {recentQueries.slice(0, 5).map((query, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setValue(query)
                      setShowSuggestions(false)
                    }}
                    className="h-7 px-3 py-1 rounded-full text-xs bg-muted/50 hover:bg-muted border-muted-foreground/20"
                  >
                    {query.length > 30 ? query.substring(0, 30) + '...' : query}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground flex items-center gap-1 px-1">
                <Sparkles className="h-3 w-3" />
                AI Suggestions
              </div>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((suggestion, index) => (
                  <Button
                    key={suggestion.id}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSuggestionSelect(suggestion)}
                    className={cn(
                      "h-7 px-3 py-1 rounded-full text-xs font-medium transition-all duration-200",
                      "hover:scale-105 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
                      "flex items-center gap-1.5 whitespace-nowrap max-w-xs",
                      selectedIndex === index && "ring-2 ring-primary ring-offset-1"
                    )}
                    title={suggestion.description}
                  >
                    <span className="truncate">{suggestion.text}</span>
                    <span className="text-xs bg-white/50 px-1 py-0 rounded text-blue-600">
                      {suggestion.confidence}%
                    </span>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 