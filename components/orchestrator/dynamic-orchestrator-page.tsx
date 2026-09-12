'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import AgentTelemetryDashboard from '@/components/orchestrator/agent-telemetry-dashboard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { 
  Database,
  Network,
  User,
  AlertCircle,
  RefreshCw,
  Zap
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { useUser } from '@/lib/stores/user'
import { getUserSupplyChains, getNodes } from '@/lib/api/supply-chain'

interface SupplyChain {
  supply_chain_id: string
  name: string
  description: string | null
  user_id: string | null
  form_data?: any
  timestamp: string | null
}

interface SupplyChainNode {
  id: string
  name: string
  type: string
  location?: string
  risk_level?: number
}

interface ApiResponse {
  status: string
  data?: any[]
  error?: string
}

export default function DynamicOrchestratorPage() {
  const searchParams = useSearchParams()
  const { userData, userLoading } = useUser()
  
  const [supplyChains, setSupplyChains] = useState<SupplyChain[]>([])
  const [selectedSupplyChain, setSelectedSupplyChain] = useState<string>("")
  const [availableNodes, setAvailableNodes] = useState<SupplyChainNode[]>([])
  const [selectedNodeId, setSelectedNodeId] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Get initial values from URL params
  const initialQuery = searchParams.get('query') || ""

  // Fetch user supply chains when user data is available
  useEffect(() => {
    if (!userLoading && userData?.id) {
      fetchUserSupplyChains()
    } else if (!userLoading && !userData?.id) {
      setError('User not found. Please log in.')
      setLoading(false)
    }
  }, [userLoading, userData])

  // Extract nodes when supply chain changes
  useEffect(() => {
    if (selectedSupplyChain) {
      fetchNodesForSupplyChain(selectedSupplyChain)
    }
  }, [selectedSupplyChain])

  const fetchUserSupplyChains = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('🔄 Fetching supply chains for user:', userData?.id)

      const response: ApiResponse = await getUserSupplyChains(userData!.id)
      
      if (response.status === 'success' && response.data) {
        const chains = response.data.map((chain: any) => ({
          supply_chain_id: chain.supply_chain_id,
          name: chain.name || 'Unnamed Supply Chain',
          description: chain.description,
          user_id: chain.user_id,
          form_data: chain.form_data,
          timestamp: chain.timestamp
        }))

        setSupplyChains(chains)

        // Auto-select first supply chain if available
        if (chains.length > 0) {
          setSelectedSupplyChain(chains[0].supply_chain_id)
        }

        console.log('✅ Loaded user supply chains:', chains.length)
      } else {
        setError('Failed to load supply chains')
        console.error('❌ Failed to fetch supply chains:', response.error)
      }

    } catch (err) {
      console.error('❌ Error fetching supply chains:', err)
      setError(err instanceof Error ? err.message : 'Failed to load supply chain data')
      
      toast({
        title: "Data Loading Failed",
        description: err instanceof Error ? err.message : 'Failed to load supply chain data',
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchNodesForSupplyChain = async (supplyChainId: string) => {
    try {
      console.log('🔄 Fetching nodes for supply chain:', supplyChainId)

      const nodes = await getNodes(supplyChainId)
      
      // Format nodes for display
      const formattedNodes = nodes.map((node: any) => ({
        id: node.node_id || node.id,
        name: node.name || 'Unnamed Node',
        type: node.type || 'Unknown',
        location: node.address || node.location || undefined,
        risk_level: node.risk_level || Math.floor(Math.random() * 100)
      }))

      setAvailableNodes(formattedNodes)
      
      // Auto-select first node if available
      if (formattedNodes.length > 0) {
        setSelectedNodeId(formattedNodes[0].id)
      } else {
        setSelectedNodeId("all")
      }

      console.log('✅ Loaded nodes:', formattedNodes.length)

    } catch (err) {
      console.error('❌ Error fetching nodes:', err)
      setAvailableNodes([])
      setSelectedNodeId("")
      
      toast({
        title: "Node Loading Failed",
        description: err instanceof Error ? err.message : 'Failed to load nodes',
        variant: "destructive",
      })
    }
  }

  const handleRefresh = () => {
    if (userData?.id) {
      fetchUserSupplyChains()
    }
  }

  // Show loading if user is still loading or if we're loading supply chains
  if (userLoading || loading) {
    return (
      <div className="min-h-full flex-1 bg-gradient-to-br from-background/90 via-card/80 to-background/95 text-foreground p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <Skeleton className="h-12 w-96 mx-auto bg-card/80" />
            <Skeleton className="h-6 w-64 mx-auto bg-card/80" />
          </div>
          <Skeleton className="h-96 w-full bg-card/80" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-full flex-1 bg-gradient-to-br from-background/90 via-destructive/10 to-background/95 text-foreground p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card className="border-destructive/40 bg-destructive/10 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                Connection Failed
              </CardTitle>
              <CardDescription className="text-destructive/80">
                Unable to connect to supply chain database
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-destructive/70">{error}</p>
              <Button 
                onClick={handleRefresh}
                className="bg-destructive hover:bg-destructive/80 text-destructive-foreground"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Connection
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full flex-1 bg-gradient-to-br from-background/90 via-card/80 to-background/95 text-foreground">
      <div className="max-w-7xl mx-auto space-y-6 p-4 md:p-6">{/* Added responsive padding */}
        
        {/* User & Supply Chain Selection */}
        <Card className="border-border/40 bg-card/80 backdrop-blur-xl shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Database className="h-5 w-5" />
              Supply Chain Selection
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Choose your supply chain and target node for analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* User Info */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-primary">Current User</label>
                <div className="p-3 bg-card/70 rounded-lg border border-border/40">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    <span className="text-foreground text-sm">
                      {userData?.email || userData?.organisation_name || 'Anonymous User'}
                    </span>
                  </div>
                  <Badge variant="outline" className="mt-2 text-primary border-primary/40">
                    {supplyChains.length} Supply Chain{supplyChains.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </div>

              {/* Supply Chain Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-primary">Supply Chain</label>
                <Select value={selectedSupplyChain} onValueChange={setSelectedSupplyChain}>
                  <SelectTrigger className="bg-card/70 border-border/40 text-foreground">
                    <SelectValue placeholder="Select supply chain..." />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border/40">
                    {supplyChains.map((chain, index) => (
                      <SelectItem key={chain.supply_chain_id || `chain-${index}`} value={chain.supply_chain_id}>
                        <div className="flex items-center gap-2">
                          <Network className="h-4 w-4" />
                          {chain.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedSupplyChain && (
                  <p className="text-xs text-muted-foreground">
                    {availableNodes.length} node{availableNodes.length !== 1 ? 's' : ''} available
                  </p>
                )}
              </div>

              {/* Node Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-primary">Target Node (Optional)</label>
                <Select value={selectedNodeId} onValueChange={setSelectedNodeId}>
                  <SelectTrigger className="bg-card/70 border-border/40 text-foreground">
                    <SelectValue placeholder="Select target node..." />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border/40">
                    <SelectItem value="all">
                      <span className="text-muted-foreground">All Nodes</span>
                    </SelectItem>
                    {availableNodes.map((node, index) => (
                      <SelectItem key={node.id || `node-${index}`} value={node.id}>
                        <div className="flex items-center gap-2">
                          <Zap className="h-3 w-3" />
                          <span>{node.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {node.type}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Agent Telemetry Dashboard */}
        {selectedSupplyChain && (
          <AgentTelemetryDashboard 
            initialQuery={initialQuery}
            initialNodeId={selectedNodeId}
            userId={userData?.id || 'demo-user'}
            supplyChainId={selectedSupplyChain}
            availableNodes={availableNodes}
          />
        )}

        {/* No Supply Chains Message */}
        {supplyChains.length === 0 && (
          <Card className="border-warning/40 bg-warning/10 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-warning">
                <AlertCircle className="h-5 w-5" />
                No Supply Chains Found
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-warning/80 mb-4">
                You don't have any supply chains configured yet. Create one to start using the orchestrator.
              </p>
              <Button 
                onClick={() => window.location.href = '/digital-twin'}
                className="bg-warning hover:bg-warning/80 text-warning-foreground"
              >
                Create Supply Chain
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
