'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Loader2, Search, AlertTriangle, TrendingUp } from 'lucide-react'

export function IntelligenceAgentDemo() {
  const [supplyChainId, setSupplyChainId] = useState('')
  const [nodeId, setNodeId] = useState('')
  const [query, setQuery] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamContent, setStreamContent] = useState('')
  const [intelligenceData, setIntelligenceData] = useState<any>(null)

  const handleStreamIntelligence = async () => {
    if (!supplyChainId) {
      alert('Please enter a supply chain ID')
      return
    }

    setIsStreaming(true)
    setStreamContent('')
    setIntelligenceData(null)

    try {
      const response = await fetch('/api/agent/info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          supply_chain_id: supplyChainId,
          node_id: nodeId || undefined,
          stream: true,
          query: query || 'Gather comprehensive supply chain intelligence and assess current risks'
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to start intelligence stream')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (reader) {
        let buffer = ''
        
        while (true) {
          const { done, value } = await reader.read()
          
          if (done) break
          
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          
          // Process complete lines
          for (let i = 0; i < lines.length - 1; i++) {
            const line = lines[i].trim()
            
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              
              if (data === '[DONE]') {
                setIsStreaming(false)
                return
              }
              
              try {
                const parsed = JSON.parse(data)
                
                if (parsed.type === 'text-delta') {
                  setStreamContent(prev => prev + (parsed.textDelta || ''))
                } else if (parsed.type === 'tool-call') {
                  setStreamContent(prev => prev + `\n🔧 **${parsed.toolName}**: ${JSON.stringify(parsed.args, null, 2)}\n`)
                } else if (parsed.type === 'tool-result') {
                  setStreamContent(prev => prev + `\n✅ **Result**: ${JSON.stringify(parsed.result, null, 2)}\n`)
                }
              } catch (parseError) {
                console.error('Error parsing stream data:', parseError)
              }
            }
          }
          
          // Keep the last incomplete line in buffer
          buffer = lines[lines.length - 1]
        }
      }
    } catch (error) {
      console.error('Stream error:', error)
      alert('Error streaming intelligence: ' + (error as Error).message)
    } finally {
      setIsStreaming(false)
    }
  }

  const handleGetIntelligence = async () => {
    if (!supplyChainId) {
      alert('Please enter a supply chain ID')
      return
    }

    try {
      const params = new URLSearchParams({
        supply_chain_id: supplyChainId,
        ...(nodeId && { node_id: nodeId })
      })

      const response = await fetch(`/api/agent/info?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get intelligence')
      }

      setIntelligenceData(data)
    } catch (error) {
      console.error('Intelligence error:', error)
      alert('Error getting intelligence: ' + (error as Error).message)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-6 w-6" />
            Supply Chain Intelligence Agent
          </CardTitle>
          <CardDescription>
            Gemini-powered AI agent with Tavily web search and Mem0 memory for real-time supply chain intelligence
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Supply Chain ID *</label>
              <Input
                placeholder="Enter supply chain ID"
                value={supplyChainId}
                onChange={(e) => setSupplyChainId(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Node ID (optional)</label>
              <Input
                placeholder="Enter specific node ID"
                value={nodeId}
                onChange={(e) => setNodeId(e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium">Custom Query (optional)</label>
            <Textarea
              placeholder="What specific intelligence would you like to gather?"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleStreamIntelligence}
              disabled={isStreaming}
              className="flex items-center gap-2"
            >
              {isStreaming ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Streaming Intelligence...
                </>
              ) : (
                <>
                  <TrendingUp className="h-4 w-4" />
                  Stream Real-time Intelligence
                </>
              )}
            </Button>
            
            <Button 
              variant="outline"
              onClick={handleGetIntelligence}
              className="flex items-center gap-2"
            >
              <Search className="h-4 w-4" />
              Get Cached Intelligence
            </Button>
          </div>
        </CardContent>
      </Card>

      {streamContent && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6" />
              Live Intelligence Stream
              {isStreaming && <Badge variant="secondary">Streaming</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg max-h-96 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm">{streamContent}</pre>
            </div>
          </CardContent>
        </Card>
      )}

      {intelligenceData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-6 w-6" />
              Intelligence Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {intelligenceData.summary?.totalNodes || 0}
                </div>
                <div className="text-sm text-gray-600">Nodes Analyzed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {Math.round(intelligenceData.summary?.averageRiskScore || 0)}
                </div>
                <div className="text-sm text-gray-600">Avg Risk Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {intelligenceData.summary?.criticalEvents || 0}
                </div>
                <div className="text-sm text-gray-600">Critical Events</div>
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg max-h-64 overflow-y-auto">
              <pre className="text-xs">{JSON.stringify(intelligenceData, null, 2)}</pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
