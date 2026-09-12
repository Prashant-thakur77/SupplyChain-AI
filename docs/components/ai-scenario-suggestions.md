# AI Scenario Suggestions Component

## Overview
The `AIScenarioSuggestions` component connects to the backend AI agent to generate intelligent supply chain disruption scenarios. It provides both recommended scenarios and custom scenario generation capabilities.

## Features

### 🤖 AI-Generated Scenarios
- Automatically fetches scenarios based on supply chain data
- Uses real-world intelligence and historical data
- Supports caching for improved performance
- Provides processing time metrics

### 🎯 Custom Scenario Generation
- User input box for custom scenario descriptions
- Configurable scenario count (1-5)
- Merges custom scenarios with recommended ones
- Real-time generation feedback

### ⚡ Performance Features
- Client-side caching (5-minute TTL)
- Refresh button to clear cache and regenerate
- Background processing indicators
- Processing time display

### 🔄 Cache Management
- Automatic caching of generated scenarios
- Manual refresh option
- Cache status indicators
- Optimized for repeated access

## API Integration

### Backend Endpoint
The component connects to `/api/agent/scenario` which supports:

**POST** - Generate new scenarios:
```typescript
{
  supplyChainId: string,           // Required
  customPrompt?: string,           // Optional custom description
  scenarioCount?: number,          // 1-5, default: 3
  timeHorizon?: number,           // 30-365 days, default: 90
  focusType?: string,             // 'ALL', 'HIGH_RISK', 'CRITICAL_NODES', 'RANDOM'
  includeHistorical?: boolean,    // default: true
  forceRefresh?: boolean          // default: false
}
```

**GET** - Retrieve cached scenarios:
```
/api/agent/scenario?supply_chain_id={id}&from_cache=true
```

### Response Format
```typescript
{
  success: boolean,
  scenarios: ScenarioData[],
  fromCache: boolean,
  generatedAt: string,
  metadata: {
    supplyChainId: string,
    selectedNodes: string[],
    intelSourcesUsed: number,
    focusType: string,
    timeHorizon: number,
    scenarioCount: number
  },
  processingTime: number
}
```

## Usage Example

```tsx
import { AIScenarioSuggestions } from '@/components/simulation/test/ai-scenario-suggestions'

function ScenarioBuilder() {
  const [isOpen, setIsOpen] = useState(false)

  const handleScenarioSelect = (scenario: ScenarioData) => {
    // Handle selected scenario
    console.log('Selected scenario:', scenario)
    // Update your scenario builder form with the data
  }

  return (
    <AIScenarioSuggestions
      open={isOpen}
      onOpenChange={setIsOpen}
      onSelectScenario={handleScenarioSelect}
    />
  )
}
```

## Scenario Data Structure

```typescript
type ScenarioData = {
  scenarioName: string
  scenarioType: string            // 'natural', 'political', 'disruption', 'demand'
  disruptionSeverity: number      // 0-100
  disruptionDuration: number      // days
  affectedNode: string
  description: string
  startDate: string               // ISO date
  endDate: string                 // ISO date
  monteCarloRuns: number
  distributionType: string
  cascadeEnabled: boolean
  failureThreshold: number        // 0-1
  bufferPercent: number           // 0-100
  alternateRouting: boolean
  randomSeed: string
}
```

## Scenario Types Mapping

The component maps API scenario types to UI types:
- `NATURAL_DISASTER` → `natural`
- `GEOPOLITICAL` → `political`
- `CYBER_ATTACK` → `disruption`
- `SUPPLY_SHORTAGE` → `disruption`
- `DEMAND_SURGE` → `demand`
- `REGULATORY` → `political`
- `ECONOMIC` → `political`
- `PANDEMIC` → `natural`
- `INFRASTRUCTURE` → `disruption`
- `CLIMATE` → `natural`

## Custom Scenario Examples

### Natural Disaster
```
"A major earthquake hits our main supplier region in Japan, affecting automotive parts production for 2 weeks with 80% severity disruption."
```

### Cyber Attack
```
"Ransomware attack on our primary logistics provider causes 5-day shutdown of distribution networks, affecting order fulfillment across all regions."
```

### Geopolitical
```
"Trade war escalation leads to 30% tariff increase on imported components, forcing supply chain redesign and alternative sourcing."
```

### Supply Shortage
```
"Semiconductor shortage due to factory fire in Taiwan affects production for 45 days, requiring inventory buffer optimization."
```

## Testing

Use the test utility to verify API connection:

```typescript
import { testScenarioAPI } from '@/utils/functions/test-scenario-api'

// Test scenario generation
await testScenarioAPI('your-supply-chain-id')

// Test cached scenarios
await testCachedScenarios('your-supply-chain-id')
```

## Performance Considerations

- Scenario generation typically takes 3-10 seconds
- Cache improves subsequent loads to sub-second response
- Custom scenarios may take longer due to complex AI processing
- Background storage doesn't block UI response

## Error Handling

The component handles various error states:
- Invalid supply chain ID
- API timeouts
- Network failures
- Invalid scenario data
- Missing required fields

All errors are displayed via toast notifications with appropriate messages.
