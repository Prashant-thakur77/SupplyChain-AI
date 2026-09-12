"use client"

import { createContext, useContext, useState, ReactNode, useCallback, useMemo, useEffect } from "react"
import { formatISO } from "date-fns"
import type { SupplyChain, Node } from "@/lib/types/database"
import { useUser } from "../stores/user"
import { getNodes, getUserSupplyChains } from "@/lib/api/supply-chain"

// Define the scenario data types
export type ScenarioData = {
  scenarioName: string
  scenarioType: string
  disruptionSeverity: number
  disruptionDuration: number
  affectedNode: string
  description: string
  
  // Advanced props
  startDate: string
  endDate: string
  monteCarloRuns: number
  distributionType: string
  cascadeEnabled: boolean
  failureThreshold: number
  bufferPercent: number
  alternateRouting: boolean
  randomSeed: string
}

// Context type definition
type ScenarioContextType = {
  scenarioData: ScenarioData
  updateScenarioData: (data: Partial<ScenarioData>) => void
  supplyChains: SupplyChain[]
  setSupplyChains: (chains: SupplyChain[]) => void
  selectedSupplyChainId: string
  setSelectedSupplyChainId: (id: string) => void
  nodes: Node[]
}

// Default values - all empty for placeholder-only approach
const defaultScenarioData: ScenarioData = {
  scenarioName: "",
  scenarioType: "",
  disruptionSeverity: 0,
  disruptionDuration: 0,
  affectedNode: "",
  description: "",
  startDate: "",
  endDate: "",
  monteCarloRuns: 0,
  distributionType: "",
  cascadeEnabled: false,
  failureThreshold: 0,
  bufferPercent: 0,
  alternateRouting: false,
  randomSeed: ""
}

// Create the context
const ScenarioContext = createContext<ScenarioContextType | undefined>(undefined)

// Context provider component
export function ScenarioProvider({ children }: { children: ReactNode }) {
  const [scenarioData, setScenarioData] = useState<ScenarioData>(defaultScenarioData)
  const [supplyChains, setSupplyChains] = useState<SupplyChain[]>([])
  const [selectedSupplyChainId, setSelectedSupplyChainId] = useState("")
  const [nodes, setNodes] = useState<Node[]>([])
  const { userData } = useUser()
  

  const updateScenarioData = useCallback((data: Partial<ScenarioData>) => {
    setScenarioData(prev => ({ ...prev, ...data }))
  }, [])

  // Fetch supply chains when user data is available
  useEffect(() => {
    const fetchSupplyChains = async () => {
      if (!userData?.id) return;

      try {
        console.log('🔄 Fetching supply chains for scenario context...');
        const response = await getUserSupplyChains(userData.id);
        
        if (response.status === 'success' && response.data) {
          const transformedData = response.data.map((chain: any) => ({
            supply_chain_id: chain.supply_chain_id,
            user_id: chain.user_id ?? null,
            name: chain.name,
            description: chain.description ?? null,
            form_data: chain.form_data ?? {},
            organisation: chain.organisation ?? {},
            timestamp: chain.timestamp ?? null
          }));
          
          console.log(`✅ Loaded ${transformedData.length} supply chains for scenario context`);
          setSupplyChains(transformedData);
        }
      } catch (error) {
        console.error('❌ Error fetching supply chains in scenario context:', error);
      }
    };

    fetchSupplyChains();
  }, [userData?.id]);

  // Auto-select first supply chain when supply chains are loaded
  useEffect(() => {
    if (supplyChains.length > 0 && !selectedSupplyChainId) {
      console.log('🔄 Auto-selecting first supply chain:', supplyChains[0].supply_chain_id);
      setSelectedSupplyChainId(supplyChains[0].supply_chain_id);
    }
  }, [supplyChains, selectedSupplyChainId]);

  useEffect(() => {
    if (selectedSupplyChainId) {
      const fetchNodes = async () => {
        try {
          const fetchedNodes = await getNodes(selectedSupplyChainId);
          setNodes(fetchedNodes);
        } catch (error) {
          console.error("Error fetching nodes for supply chain:", error);
          setNodes([]);
        }
      };
      fetchNodes();
    } else {
      setNodes([]);
    }
  }, [selectedSupplyChainId]);

  const contextValue = useMemo(() => ({
    scenarioData,
    updateScenarioData,
    supplyChains,
    setSupplyChains,
    selectedSupplyChainId,
    setSelectedSupplyChainId,
    nodes
  }), [scenarioData, updateScenarioData, supplyChains, selectedSupplyChainId, nodes])

  return (
    <ScenarioContext.Provider value={contextValue}>
      {children}
    </ScenarioContext.Provider>
  )
}

// Hook to use the context
export function useScenario() {
  const context = useContext(ScenarioContext)
  if (context === undefined) {
    throw new Error('useScenario must be used within a ScenarioProvider')
  }
  return context
}