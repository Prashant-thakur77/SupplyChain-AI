"use client"

import { useEffect, useMemo, useState } from "react"
import { Calculator, AlertTriangle, Zap, Factory, Layers, Workflow, Info } from "lucide-react"
import { ClockIcon, ShieldCheckIcon, TrendingUpIcon, CalendarDaysIcon, RouteIcon } from "@/components/icons"
import { CogIcon } from "@/components/icons/cog-icon"
import { SettingsIcon } from "@/components/icons/settings-icon"
import { FileTextIcon } from "@/components/icons/file-text-icon"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { DatePicker } from "@/components/ui/date-picker"
import { MultiSelect } from "@/components/ui/multiselect"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useScenario } from "@/lib/context/scenario-context"
import { getNodes } from "@/lib/api/supply-chain"
import { Node as DbNode } from "@/lib/types/database"
import { nodeTypeToIcon } from "@/components/digital-twin/utils/icon-mapping"

// Helper component for labels with tooltips
const LabelWithTooltip = ({ 
  children, 
  tooltip, 
  className = "text-sm font-[600] text-theme-text-primary",
  ...props 
}: {
  children: React.ReactNode
  tooltip: string
  className?: string
  htmlFor?: string
}) => (
  <div className="flex items-center gap-1.5">
    <Label className={className} {...props}>
      {children}
    </Label>
    <Tooltip>
      <TooltipTrigger asChild>
        <Info className="h-3.5 w-3.5 text-theme-text-muted hover:text-theme-blue cursor-help flex-shrink-0 transition-colors" />
      </TooltipTrigger>
      <TooltipContent className="max-w-xs bg-theme-bg-surface border border-theme-border-subtle text-theme-text-primary rounded-theme-md shadow-md">
        <p className="text-[11px] leading-relaxed font-normal">{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  </div>
)

export function ScenarioConfigurationForm() {
  const { scenarioData, updateScenarioData, supplyChains, selectedSupplyChainId, setSelectedSupplyChainId } = useScenario()
  const [nodes, setNodes] = useState<DbNode[]>([]);
  const [isLoadingNodes, setIsLoadingNodes] = useState(false);

  useEffect(() => {
    setNodes([]);
    updateScenarioData({ affectedNode: '' });

    if (selectedSupplyChainId) {
      setIsLoadingNodes(true);
      getNodes(selectedSupplyChainId)
        .then(setNodes)
        .catch(error => {
          console.error("Failed to fetch nodes:", error);
          setNodes([]);
        })
        .finally(() => {
          setIsLoadingNodes(false);
        });
    }
  }, [selectedSupplyChainId, updateScenarioData]);

  const affectedNodeOptions = useMemo(() => 
    nodes
      .filter(node => node.name)
      .map(node => ({
        label: node.name!,
        value: node.node_id,
        icon: node.type ? nodeTypeToIcon[node.type] || Factory : Factory,
      })), [nodes]
  );

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Main Configuration Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Configuration Card - Left Side */}
          <Card className="border border-theme-border-subtle bg-theme-bg-surface text-theme-text-primary shadow-sm rounded-theme-lg transition-all duration-300 hover:shadow-md">
            <CardHeader className="pb-4 border-b border-theme-border-subtle/50">
              <CardTitle className="flex items-center gap-2 text-base text-theme-text-primary font-bold">
                <CogIcon size={18} className="text-theme-blue" />
                Basic Configuration
              </CardTitle>
              <CardDescription className="text-xs text-theme-text-secondary">Configure your core scenario parameters</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="space-y-2.5">
                  <LabelWithTooltip 
                    htmlFor="scenario-name"
                    tooltip="Give your scenario a descriptive name that clearly identifies the situation you want to simulate. For example: 'Port Strike Analysis', 'Supplier Factory Fire', or 'Pandemic Supply Chain Impact'."
                  >
                    Scenario Name
                  </LabelWithTooltip>
                  <Input
                    id="scenario-name"
                    className="h-10 shadow-sm text-xs rounded-theme-md bg-theme-bg-surface border-theme-border-subtle hover:border-theme-border-default focus:ring-2 focus:ring-theme-blue/30 focus:border-theme-blue focus:outline-none transition-all duration-200"
                    placeholder="Enter scenario name"
                    value={scenarioData.scenarioName}
                    onChange={(e) => updateScenarioData({ scenarioName: e.target.value })}
                  />
                </div>

                <div className="space-y-2.5">
                  <LabelWithTooltip 
                    tooltip="Select the category that best describes your scenario. This helps determine appropriate simulation parameters and analysis methods."
                  >
                    Scenario Type
                  </LabelWithTooltip>
                  <Select 
                    value={scenarioData.scenarioType} 
                    onValueChange={(val) => updateScenarioData({ scenarioType: val })}
                  >
                    <SelectTrigger className="h-10 shadow-sm text-xs rounded-theme-md bg-theme-bg-surface border-theme-border-subtle hover:border-theme-border-default focus:ring-2 focus:ring-theme-blue/30 focus:border-theme-blue focus:outline-none transition-all duration-200">
                      <SelectValue placeholder="Select scenario type" />
                    </SelectTrigger>
                    <SelectContent className="bg-theme-bg-surface border-theme-border-subtle text-theme-text-primary rounded-theme-md">
                      <SelectItem value="disruption">Supply Disruption</SelectItem>
                      <SelectItem value="natural">Natural Disaster</SelectItem>
                      <SelectItem value="political">Political Event</SelectItem>
                      <SelectItem value="demand">Demand Surge</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="space-y-2.5">
                  <LabelWithTooltip 
                    tooltip="Choose which supply chain you want to analyze. This determines the network structure, nodes, and relationships that will be used in your simulation."
                  >
                    Supply Chain
                  </LabelWithTooltip>
                  <Select value={selectedSupplyChainId || ''} onValueChange={setSelectedSupplyChainId}>
                    <SelectTrigger className="h-10 shadow-sm text-xs rounded-theme-md bg-theme-bg-surface border-theme-border-subtle hover:border-theme-border-default focus:ring-2 focus:ring-theme-blue/30 focus:border-theme-blue focus:outline-none transition-all duration-200">
                      <SelectValue placeholder="Select supply chain" />
                    </SelectTrigger>
                    <SelectContent className="bg-theme-bg-surface border-theme-border-subtle text-theme-text-primary rounded-theme-md">
                      {supplyChains.map((chain) => (
                        <SelectItem key={chain.supply_chain_id} value={chain.supply_chain_id}>
                          {chain.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2.5">
                  <LabelWithTooltip 
                    tooltip="Select the specific nodes (suppliers, warehouses, factories, etc.) that will be directly impacted by your scenario. You can select multiple nodes to simulate widespread disruptions."
                  >
                    Affected Nodes
                  </LabelWithTooltip>
                  <MultiSelect
                    options={affectedNodeOptions}
                    onValueChange={(values) => updateScenarioData({ affectedNode: values.join(',') })}
                    defaultValue={scenarioData.affectedNode ? scenarioData.affectedNode.split(',') : []}
                    placeholder={!selectedSupplyChainId ? "Select supply chain first" : isLoadingNodes ? "Loading nodes..." : "Select affected nodes"}
                    className="shadow-sm min-h-10 text-xs rounded-theme-md bg-theme-bg-surface border-theme-border-subtle hover:border-theme-border-default focus:ring-2 focus:ring-theme-blue/30 focus:border-theme-blue focus:outline-none transition-all duration-200"
                    maxCount={3}
                    disabled={isLoadingNodes || !selectedSupplyChainId}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description and Impact Parameters Card - Right Side */}
          <Card className="border border-theme-border-subtle bg-theme-bg-surface text-theme-text-primary shadow-sm rounded-theme-lg transition-all duration-300 hover:shadow-md">
            <CardHeader className="pb-4 border-b border-theme-border-subtle/50">
              <CardTitle className="flex items-center gap-2 text-base text-theme-text-primary font-bold">
                <FileTextIcon size={18} className="text-theme-green" />
                Description & Impact Parameters
              </CardTitle>
              <CardDescription className="text-xs text-theme-text-secondary">Describe your scenario and set disruption parameters</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="space-y-2.5">
                <LabelWithTooltip 
                  tooltip="Provide a detailed description of your scenario including the cause, scope, and expected impact. This helps contextualize your simulation results and aids in interpretation."
                >
                  Description
                </LabelWithTooltip>
                <Textarea
                  className="min-h-[85px] shadow-sm text-xs rounded-theme-md bg-theme-bg-surface border-theme-border-subtle hover:border-theme-border-default focus:ring-2 focus:ring-theme-blue/30 focus:border-theme-blue focus:outline-none transition-all duration-200"
                  placeholder="Describe your scenario in detail"
                  value={scenarioData.description}
                  onChange={(e) => updateScenarioData({ description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="space-y-2.5">
                  <LabelWithTooltip 
                    tooltip="Enter the percentage reduction in operational capacity (0-100%). For example: 75% means the affected nodes operate at only 25% of normal capacity during the disruption."
                    className="flex items-center gap-1.5 text-xs font-[600] text-theme-text-primary"
                  >
                    <TrendingUpIcon size={14} className="text-theme-blue" />
                    Disruption Severity (%)
                  </LabelWithTooltip>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    className="h-10 shadow-sm text-xs rounded-theme-md bg-theme-bg-surface border-theme-border-subtle hover:border-theme-border-default focus:ring-2 focus:ring-theme-blue/30 focus:border-theme-blue focus:outline-none transition-all duration-200"
                    value={scenarioData.disruptionSeverity || ''}
                    onChange={(e) => updateScenarioData({ disruptionSeverity: e.target.value ? Number(e.target.value) : 0 })}
                    placeholder="e.g., 75"
                  />
                </div>

                <div className="space-y-2.5">
                  <LabelWithTooltip 
                    tooltip="Specify how long the disruption will last in days. This affects the total impact on your supply chain and recovery time calculations."
                    className="flex items-center gap-1.5 text-xs font-[600] text-theme-text-primary"
                  >
                    <ClockIcon size={14} className="text-theme-blue" />
                    Disruption Duration (days)
                  </LabelWithTooltip>
                  <Input
                    type="number"
                    min={1}
                    max={365}
                    step={1}
                    className="h-10 shadow-sm text-xs rounded-theme-md bg-theme-bg-surface border-theme-border-subtle hover:border-theme-border-default focus:ring-2 focus:ring-theme-blue/30 focus:border-theme-blue focus:outline-none transition-all duration-200"
                    value={scenarioData.disruptionDuration || ''}
                    onChange={(e) => updateScenarioData({ disruptionDuration: e.target.value ? Number(e.target.value) : 0 })}
                    placeholder="e.g., 14"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Advanced Settings Card */}
        <Card className="border border-theme-border-subtle bg-theme-bg-surface text-theme-text-primary shadow-sm rounded-theme-lg transition-all duration-300 hover:shadow-md">
          <CardHeader className="pb-4 border-b border-theme-border-subtle/50">
            <CardTitle className="flex items-center gap-2 text-base text-theme-text-primary font-bold">
              <SettingsIcon size={18} className="text-theme-blue" />
              Advanced Settings
            </CardTitle>
            <CardDescription className="text-xs text-theme-text-secondary">Configure advanced simulation parameters</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-6">
              {/* Simulation Parameters Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="space-y-2.5">
                  <LabelWithTooltip 
                    className="flex items-center gap-1.5 text-xs font-[600] text-theme-text-primary"
                    tooltip="Number of simulation iterations to run. Higher values provide more accurate results but take longer to compute. Recommended: 1000-10000 for most scenarios."
                  >
                    <Calculator className="h-3.5 w-3.5 text-theme-blue" />
                    Monte Carlo Runs
                  </LabelWithTooltip>
                  <Input
                    type="number"
                    min={100}
                    max={50000}
                    step={100}
                    className="h-10 shadow-sm text-xs rounded-theme-md bg-theme-bg-surface border-theme-border-subtle hover:border-theme-border-default focus:ring-2 focus:ring-theme-blue/30 focus:border-theme-blue focus:outline-none transition-all duration-200"
                    value={scenarioData.monteCarloRuns || ''}
                    onChange={(e) => updateScenarioData({ monteCarloRuns: e.target.value ? Number(e.target.value) : 0 })}
                    placeholder="e.g., 1000"
                  />
                </div>

                <div className="space-y-2.5">
                  <LabelWithTooltip 
                    className="text-xs font-[600] text-theme-text-primary"
                    tooltip="Statistical distribution used for random variables in the simulation. Normal is most common, Uniform for equal probability ranges, Exponential for failure rates."
                  >
                    Distribution Type
                  </LabelWithTooltip>
                  <Select 
                    value={scenarioData.distributionType} 
                    onValueChange={(val) => updateScenarioData({ distributionType: val })}
                  >
                    <SelectTrigger className="h-10 shadow-sm text-xs rounded-theme-md bg-theme-bg-surface border-theme-border-subtle hover:border-theme-border-default focus:ring-2 focus:ring-theme-blue/30 focus:border-theme-blue focus:outline-none transition-all duration-200">
                      <SelectValue placeholder="Select distribution" />
                    </SelectTrigger>
                    <SelectContent className="bg-theme-bg-surface border-theme-border-subtle text-theme-text-primary rounded-theme-md">
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="uniform">Uniform</SelectItem>
                      <SelectItem value="exponential">Exponential</SelectItem>
                      <SelectItem value="lognormal">Log-Normal</SelectItem>
                      <SelectItem value="beta">Beta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2.5">
                  <LabelWithTooltip 
                    className="flex items-center gap-1.5 text-xs font-[600] text-theme-text-primary"
                    tooltip="Percentage threshold at which a node is considered failed (0-100%). When a node's capacity drops below this level, it triggers additional effects and potential cascading failures."
                  >
                    <AlertTriangle className="h-3.5 w-3.5 text-theme-amber" />
                    Failure Threshold (%)
                  </LabelWithTooltip>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step={5}
                    className="h-10 shadow-sm text-xs rounded-theme-md bg-theme-bg-surface border-theme-border-subtle hover:border-theme-border-default focus:ring-2 focus:ring-theme-blue/30 focus:border-theme-blue focus:outline-none transition-all duration-200"
                    value={scenarioData.failureThreshold || ''}
                    onChange={(e) => updateScenarioData({ failureThreshold: e.target.value ? Number(e.target.value) : 0 })}
                    placeholder="e.g., 30"
                  />
                </div>

                <div className="space-y-2.5">
                  <LabelWithTooltip 
                    className="flex items-center gap-1.5 text-xs font-[600] text-theme-text-primary"
                    tooltip="Additional inventory buffer as a percentage of normal stock levels (0-200%). Higher buffers provide more resilience but increase costs. Typical range: 10-50%."
                  >
                    <ShieldCheckIcon size={14} className="text-theme-green" />
                    Inventory Buffer (%)
                  </LabelWithTooltip>
                  <Input
                    type="number"
                    min={0}
                    max={200}
                    step={5}
                    className="h-10 shadow-sm text-xs rounded-theme-md bg-theme-bg-surface border-theme-border-subtle hover:border-theme-border-default focus:ring-2 focus:ring-theme-blue/30 focus:border-theme-blue focus:outline-none transition-all duration-200"
                    value={scenarioData.bufferPercent || ''}
                    onChange={(e) => updateScenarioData({ bufferPercent: e.target.value ? Number(e.target.value) : 0 })}
                    placeholder="e.g., 20"
                  />
                </div>
              </div>

              {/* Date parameters and random seed */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-2.5">
                  <LabelWithTooltip 
                    className="flex items-center gap-1.5 text-xs font-[600] text-theme-text-primary"
                    tooltip="When the disruption begins. This affects seasonal factors, demand patterns, and other time-dependent variables in your supply chain model."
                  >
                    <CalendarDaysIcon size={14} className="text-theme-blue" />
                    Start Date & Time
                  </LabelWithTooltip>
                  <DatePicker
                    date={scenarioData.startDate ? new Date(scenarioData.startDate) : undefined}
                    onSelect={(date: Date | undefined) => updateScenarioData({ startDate: date ? date.toISOString().slice(0, 16) : '' })}
                    placeholder="Select start date and time"
                    className="h-10 shadow-sm text-xs w-full rounded-theme-md bg-theme-bg-surface border-theme-border-subtle hover:border-theme-border-default focus:ring-2 focus:ring-theme-blue/30 focus:border-theme-blue focus:outline-none transition-all duration-200"
                    showTime={true}
                  />
                </div>

                <div className="space-y-2.5">
                  <LabelWithTooltip 
                    className="flex items-center gap-1.5 text-xs font-[600] text-theme-text-primary"
                    tooltip="When the disruption ends and normal operations resume. The simulation will continue beyond this date to analyze recovery time and long-term effects."
                  >
                    <CalendarDaysIcon size={14} className="text-theme-blue" />
                    End Date & Time
                  </LabelWithTooltip>
                  <DatePicker
                    date={scenarioData.endDate ? new Date(scenarioData.endDate) : undefined}
                    onSelect={(date: Date | undefined) => updateScenarioData({ endDate: date ? date.toISOString().slice(0, 16) : '' })}
                    placeholder="Select end date and time"
                    className="h-10 shadow-sm text-xs w-full rounded-theme-md bg-theme-bg-surface border-theme-border-subtle hover:border-theme-border-default focus:ring-2 focus:ring-theme-blue/30 focus:border-theme-blue focus:outline-none transition-all duration-200"
                    showTime={true}
                  />
                </div>

                <div className="space-y-2.5">
                  <LabelWithTooltip 
                    className="text-xs font-[600] text-theme-text-primary"
                    tooltip="Optional number to ensure reproducible results. Use the same seed to get identical simulation outcomes for comparison purposes. Leave blank for random results."
                  >
                    Random Seed
                  </LabelWithTooltip>
                  <Input
                    className="h-10 shadow-sm text-xs rounded-theme-md bg-theme-bg-surface border-theme-border-subtle hover:border-theme-border-default focus:ring-2 focus:ring-theme-blue/30 focus:border-theme-blue focus:outline-none transition-all duration-200"
                    placeholder="Enter seed (optional)"
                    value={scenarioData.randomSeed || ''}
                    onChange={(e) => updateScenarioData({ randomSeed: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Simulation Features switches */}
            <div className="pt-6 border-t border-theme-border-subtle/50 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2.5">
                  <LabelWithTooltip 
                    className="flex items-center gap-1.5 text-xs font-[600] text-theme-text-primary"
                    tooltip="When enabled, failures can spread from affected nodes to connected nodes based on dependency relationships. This simulates how disruptions can propagate through your supply chain network."
                  >
                    <Zap className="h-4 w-4 text-theme-amber animate-pulse" />
                    Cascading Failures
                  </LabelWithTooltip>
                  <div className="flex items-center">
                    <Switch
                      checked={scenarioData.cascadeEnabled || false}
                      onCheckedChange={(val) => updateScenarioData({ cascadeEnabled: val })}
                    />
                    <span className="ml-2.5 text-xs text-theme-text-secondary font-medium">
                      {scenarioData.cascadeEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <LabelWithTooltip 
                    className="flex items-center gap-1.5 text-xs font-[600] text-theme-text-primary"
                    tooltip="When enabled, the system will automatically find alternative routes and suppliers when primary paths are disrupted. This represents your supply chain's adaptive capabilities."
                  >
                    <RouteIcon size={14} className="text-theme-blue" />
                    Alternate Routing
                  </LabelWithTooltip>
                  <div className="flex items-center">
                    <Switch
                      checked={scenarioData.alternateRouting || false}
                      onCheckedChange={(val) => updateScenarioData({ alternateRouting: val })}
                    />
                    <span className="ml-2.5 text-xs text-theme-text-secondary font-medium">
                      {scenarioData.alternateRouting ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  )
}