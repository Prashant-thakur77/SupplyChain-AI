"use client"

import React, { useState, useRef } from "react";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { debounce } from "lodash";

type Props = {
  startDate: string
  endDate: string
  setStartDate: (val: string) => void
  setEndDate: (val: string) => void

  monteCarloRuns: number
  setMonteCarloRuns: (val: number) => void

  distributionType: string
  setDistributionType: (val: string) => void

  cascadeEnabled: boolean
  setCascadeEnabled: (val: boolean) => void

  failureThreshold: number
  setFailureThreshold: (val: number) => void

  bufferPercent: number
  setBufferPercent: (val: number) => void

  alternateRouting: boolean
  setAlternateRouting: (val: boolean) => void

  randomSeed: string
  setRandomSeed: (val: string) => void
}

export function AdvancedSettings(props: Props) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  // Local state for sliders
  const [failureThreshold, setFailureThreshold] = useState(props.failureThreshold);
  const [bufferPercent, setBufferPercent] = useState(props.bufferPercent);

  // Debounced setters
  const debouncedSetFailureThreshold = useRef(debounce((val: number) => props.setFailureThreshold(val), 150)).current;
  const debouncedSetBufferPercent = useRef(debounce((val: number) => props.setBufferPercent(val), 150)).current;

  // Sync local state with props if they change externally
  React.useEffect(() => { setFailureThreshold(props.failureThreshold); }, [props.failureThreshold]);
  React.useEffect(() => { setBufferPercent(props.bufferPercent); }, [props.bufferPercent]);

  return (
    <Card className="mt-4 bg-muted p-4">
      <div className="flex items-center justify-between mb-2">
        <CardTitle className="text-sm">Advanced Settings</CardTitle>
        <button
          className="p-2 rounded-full bg-muted hover:bg-primary hover:text-white transition-colors"
          onClick={() => setShowAdvanced(!showAdvanced)}
          aria-label="Toggle Advanced Settings"
        >
          {showAdvanced ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
          ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
          )}
        </button>
      </div>
      {showAdvanced && (
        <div className="space-y-4">
          <div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Label>Start Date</Label>
              </TooltipTrigger>
              <TooltipContent>Select the start date for the simulation</TooltipContent>
            </Tooltip>
            <Input type="datetime-local" value={props.startDate} onChange={(e) => props.setStartDate(e.target.value)} />
          </div>
          <div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Label>End Date</Label>
              </TooltipTrigger>
              <TooltipContent>Select the end date for the simulation</TooltipContent>
            </Tooltip>
            <Input type="datetime-local" value={props.endDate} onChange={(e) => props.setEndDate(e.target.value)} />
          </div>
          <div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Label>Monte Carlo Runs</Label>
              </TooltipTrigger>
              <TooltipContent>Number of Monte Carlo simulation runs</TooltipContent>
            </Tooltip>
            <Input type="number" value={props.monteCarloRuns} onChange={(e) => props.setMonteCarloRuns(Number(e.target.value))} />
          </div>
          <div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Label>Distribution Type</Label>
              </TooltipTrigger>
              <TooltipContent>Choose the type of distribution for the simulation</TooltipContent>
            </Tooltip>
            <Select value={props.distributionType} onValueChange={props.setDistributionType}>
              <SelectTrigger><SelectValue placeholder="Distribution" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="uniform">Uniform</SelectItem>
                <SelectItem value="exponential">Exponential</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-between items-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <Label>Cascading Failures</Label>
              </TooltipTrigger>
              <TooltipContent>Enable cascading failures in the simulation</TooltipContent>
            </Tooltip>
            <Switch checked={props.cascadeEnabled} onCheckedChange={props.setCascadeEnabled} />
          </div>
          <div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Label>
                  Failure Threshold (%)
                  <span className="ml-2 text-xs text-muted-foreground">{failureThreshold}%</span>
                </Label>
              </TooltipTrigger>
              <TooltipContent>Set the failure threshold percentage</TooltipContent>
            </Tooltip>
            <Slider
              value={[failureThreshold]}
              max={100}
              step={5}
              onValueChange={([val]) => {
                setFailureThreshold(val);
                debouncedSetFailureThreshold(val);
              }}
            />
          </div>
          <div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Label>
                  Inventory Buffer (%)
                  <span className="ml-2 text-xs text-muted-foreground">{bufferPercent}%</span>
                </Label>
              </TooltipTrigger>
              <TooltipContent>Set the inventory buffer percentage</TooltipContent>
            </Tooltip>
            <Slider
              value={[bufferPercent]}
              max={200}
              step={5}
              onValueChange={([val]) => {
                setBufferPercent(val);
                debouncedSetBufferPercent(val);
              }}
            />
          </div>
          <div className="flex justify-between items-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <Label>Alternate Routing</Label>
              </TooltipTrigger>
              <TooltipContent>Enable alternate routing in the simulation</TooltipContent>
            </Tooltip>
            <Switch checked={props.alternateRouting} onCheckedChange={props.setAlternateRouting} />
          </div>
          <div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Label>Random Seed</Label>
              </TooltipTrigger>
              <TooltipContent>Set a random seed for reproducibility</TooltipContent>
            </Tooltip>
            <Input value={props.randomSeed} onChange={(e) => props.setRandomSeed(e.target.value)} />
          </div>
        </div>
      )}
    </Card>
  );
}
