"use client"

import { Card } from "@/components/ui/card"
import { CardHeader } from "@/components/ui/card"
import { CardTitle } from "@/components/ui/card"
import { CardDescription } from "@/components/ui/card"
import { CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { SelectTrigger } from "@/components/ui/select"
import { SelectValue } from "@/components/ui/select"
import { SelectContent } from "@/components/ui/select"
import { SelectItem } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { AdvancedSettings } from "./advanced-settings"
import { useScenario } from "@/lib/context/scenario-context"
import type { SupplyChain, Node } from "@/lib/types/database"

type Props = {
  scenarioName: string
  setScenarioName: (val: string) => void
  scenarioType: string
  setScenarioType: (val: string) => void
  supplyChains: SupplyChain[]
  selectedSupplyChainId: string
  handleSupplyChainChange: (val: string) => void
  disruptionSeverity: number
  setDisruptionSeverity: (val: number) => void
  disruptionDuration: number
  setDisruptionDuration: (val: number) => void
  affectedNode: string
  setAffectedNode: (val: string) => void
  description: string
  setDescription: (val: string) => void
  nodes: Node[]

  // advanced props passed to AdvancedSettings
  advancedProps: any
}

export function ScenarioBuilder(props: Props) {
  return (
    <Card className="border-0 rounded-none">
      <CardHeader>
        <CardTitle>Scenario Builder</CardTitle>
        <CardDescription>Configure your simulation scenario</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">

        <Label>Scenario Name</Label>
        <Input value={props.scenarioName} onChange={(e) => props.setScenarioName(e.target.value)} />

        <Label>Scenario Type</Label>
        <Select value={props.scenarioType} onValueChange={props.setScenarioType}>
          <SelectTrigger><SelectValue placeholder="Select scenario type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="disruption">Supply Disruption</SelectItem>
            <SelectItem value="natural">Natural Disaster</SelectItem>
            <SelectItem value="political">Political Event</SelectItem>
            <SelectItem value="demand">Demand Surge</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>

        <Label>Supply Chain</Label>
        <Select value={props.selectedSupplyChainId} onValueChange={props.handleSupplyChainChange}>
          <SelectTrigger><SelectValue placeholder="Select supply chain" /></SelectTrigger>
          <SelectContent>
            {props.supplyChains.map((chain) => (
              <SelectItem key={chain.supply_chain_id} value={chain.supply_chain_id}>
                {chain.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Label>
          Disruption Severity
          <span className="ml-2 text-xs text-muted-foreground">{props.disruptionSeverity}%</span>
        </Label>
        <Slider value={[props.disruptionSeverity]} max={100} step={1} onValueChange={(v) => props.setDisruptionSeverity(v[0])} />

        <Label>
          Disruption Duration (days)
          <span className="ml-2 text-xs text-muted-foreground">{props.disruptionDuration}</span>
        </Label>
        <Slider value={[props.disruptionDuration]} max={30} step={1} onValueChange={(v) => props.setDisruptionDuration(v[0])} />

        <Label>Affected Node</Label>
        <Select
          value={props.affectedNode}
          onValueChange={props.setAffectedNode}
          disabled={!props.selectedSupplyChainId || props.nodes.length === 0}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select node" />
          </SelectTrigger>
          <SelectContent>
            {props.nodes.map(node => (
              <SelectItem key={node.node_id} value={node.node_id}>
                {node.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Label>Description</Label>
        <Textarea value={props.description} onChange={(e) => props.setDescription(e.target.value)} />

        {/* Advanced Settings Injected Here */}
        <AdvancedSettings {...props.advancedProps} />
      </CardContent>
    </Card>
  )
}

// This is the new context-connected version of the component
export function ScenarioBuilderWithContext() {
  const { 
    scenarioData, 
    updateScenarioData, 
    supplyChains, 
    selectedSupplyChainId, 
    setSelectedSupplyChainId,
    nodes 
  } = useScenario();

  // Handler for updating individual scenario fields
  const handleScenarioUpdate = (field: string, value: any) => {
    updateScenarioData({ [field]: value });
  };

  // Create the props object for the base ScenarioBuilder
  const scenarioBuilderProps: Props = {
    scenarioName: scenarioData.scenarioName,
    setScenarioName: (val) => handleScenarioUpdate('scenarioName', val),
    scenarioType: scenarioData.scenarioType,
    setScenarioType: (val) => handleScenarioUpdate('scenarioType', val),
    supplyChains,
    selectedSupplyChainId,
    handleSupplyChainChange: setSelectedSupplyChainId,
    disruptionSeverity: scenarioData.disruptionSeverity,
    setDisruptionSeverity: (val) => handleScenarioUpdate('disruptionSeverity', val),
    disruptionDuration: scenarioData.disruptionDuration,
    setDisruptionDuration: (val) => handleScenarioUpdate('disruptionDuration', val),
    affectedNode: scenarioData.affectedNode,
    setAffectedNode: (val) => handleScenarioUpdate('affectedNode', val),
    description: scenarioData.description,
    setDescription: (val) => handleScenarioUpdate('description', val),
    nodes,
    advancedProps: {
      startDate: scenarioData.startDate,
      setStartDate: (val: string) => handleScenarioUpdate('startDate', val),
      endDate: scenarioData.endDate, 
      setEndDate: (val: string) => handleScenarioUpdate('endDate', val),
      monteCarloRuns: scenarioData.monteCarloRuns,
      setMonteCarloRuns: (val: number) => handleScenarioUpdate('monteCarloRuns', val),
      distributionType: scenarioData.distributionType,
      setDistributionType: (val: string) => handleScenarioUpdate('distributionType', val),
      cascadeEnabled: scenarioData.cascadeEnabled,
      setCascadeEnabled: (val: boolean) => handleScenarioUpdate('cascadeEnabled', val),
      failureThreshold: scenarioData.failureThreshold,
      setFailureThreshold: (val: number) => handleScenarioUpdate('failureThreshold', val),
      bufferPercent: scenarioData.bufferPercent,
      setBufferPercent: (val: number) => handleScenarioUpdate('bufferPercent', val),
      alternateRouting: scenarioData.alternateRouting,
      setAlternateRouting: (val: boolean) => handleScenarioUpdate('alternateRouting', val),
      randomSeed: scenarioData.randomSeed,
      setRandomSeed: (val: string) => handleScenarioUpdate('randomSeed', val),
    }
  };
  
  return <ScenarioBuilder {...scenarioBuilderProps} />;
}
