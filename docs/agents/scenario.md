# Scenario Generator Agent

## Overview

The **Scenario Generator Agent** is a production-grade AI-powered agent that creates realistic supply chain disruption scenarios for risk assessment and strategic planning. It leverages multiple data sources including supply chain intelligence, historical context from Mem0, and real-time data to generate comprehensive scenario sets for Monte Carlo simulations.

## Architecture

## Architecture

### Core Components

- **⚡ High-Performance Design**: Optimized for <10 second response times
- **📊 Performance Monitoring**: Real-time timing and checkpoint logging  
- **🏎️ Speed Optimizations**: Parallel data fetching, background processing, efficient caching
- **🧠 Smart AI Configuration**: Gemini Flash model for 3x faster generation
- **📚 Memory System**: Mem0 for contextual memory with timeout handling
- **⚡ Redis Caching**: Sub-second cache retrieval for repeated requests
- **✅ Background Processing**: Non-blocking storage and caching operations
- **🎯 Focused Data**: Minimal data fetching for essential context only

### Performance Features

- ✅ **Sub-10 Second Generation**: Target response time under 10 seconds
- ✅ **Parallel Data Fetching**: Simultaneous intelligence and chain data retrieval  
- ✅ **Timeout Protection**: 2-3 second timeouts on external API calls
- ✅ **Background Operations**: Storage and caching don't block response
- ✅ **Optimized AI Model**: Gemini Flash for 60% faster generation
- ✅ **Smart Node Selection**: Limited to 3 nodes max for speed
- ✅ **Efficient Caching**: 1-hour Redis cache with sub-50ms retrieval
- ✅ **Performance Logging**: Detailed timing for each operation phase

## ⚡ Performance Optimizations

### Speed Improvements Applied

The Scenario Generator has been optimized for **sub-10 second response times** with the following enhancements:

#### 🏎️ **AI Model Optimization**
- **Gemini Flash**: Switched from Gemini Pro to Gemini Flash (60% faster)
- **Token Limiting**: Max 2000 tokens for faster processing
- **Temperature Control**: Reduced to 0.7 for quicker generation

#### 📊 **Data Fetching Optimizations**
- **Parallel Processing**: Intelligence and chain data fetched simultaneously
- **Timeout Protection**: 2-3 second timeouts on external API calls
- **Data Limiting**: Max 3 intelligence records, 50 nodes for speed
- **Essential Fields Only**: Reduced database queries to critical data

#### 🎯 **Processing Optimizations**
- **Node Reduction**: Limited to 3 target nodes max (from 5-10)
- **Scenario Limits**: Max 5 scenarios (reduced from 10)
- **Background Operations**: Storage and caching run in background
- **Smart Defaults**: Reduced default scenario count to 3

#### 📱 **Performance Monitoring**
```typescript
// Real-time performance checkpoints
⚡ Request validation: 5ms
⚡ Cache check: 12ms
⚡ Data fetching: 850ms
⚡ Data processing: 45ms
⚡ Node selection: 25ms
⚡ Prompt building: 15ms
⚡ AI generation: 4200ms
⚡ Scenario enhancement: 35ms
⚡ Final processing: 25ms
✅ Scenario generation completed in 5212ms
```

#### 🚀 **Expected Performance**
- **Cache Hit**: < 50ms (sub-second response)
- **Fresh Generation**: 5-8 seconds (down from 60+ seconds)
- **Background Storage**: Non-blocking, completes in 1-3 seconds
- **Memory Operations**: 2-3 second timeout for resilience

## API Endpoints

### POST `/api/agent/scenario`

Generate new supply chain disruption scenarios for a given supply chain.

#### Request Schema

```typescript
{
  supplyChainId: string,           // Required: Supply chain ID
  customPrompt?: string,           // Optional: Custom scenario generation prompt
  scenarioCount?: number,          // Optional: Number of scenarios (3-5, default: 3)
  timeHorizon?: number,            // Optional: Time horizon in days (30-365, default: 90)
  focusType?: string,              // Optional: Node selection strategy (default: "ALL")
  includeHistorical?: boolean,     // Optional: Include historical context (default: true)
  forceRefresh?: boolean          // Optional: Force refresh cache (default: false)
}
```

**Performance Notes:**
- Max 5 scenarios for optimal speed (reduced from 10)
- Default scenario count reduced to 3 for faster generation
- Background storage and caching for non-blocking response

#### Focus Types

- **ALL**: Smart mix of top-2 risk nodes + critical infrastructure + random selection
- **HIGH_RISK**: Focus on highest risk-level nodes
- **CRITICAL_NODES**: Target critical infrastructure (ports, factories, warehouses)
- **RANDOM**: Pure random selection from available nodes

#### Response Schema

```typescript
{
  success: boolean,
  scenarios: ScenarioOutput[],     // Array of generated scenarios
  fromCache: boolean,              // Whether result came from cache
  generatedAt: string,             // ISO timestamp
  metadata: {
    supplyChainId: string,
    selectedNodes: string[],       // Node IDs used for generation
    intelSourcesUsed: number,      // Number of intelligence sources
    intelSource: string,           // Source type (mem0|supabase|none)
    focusType: string,
    timeHorizon: number,
    scenarioCount: number
  },
  processingTime: number,          // Processing time in milliseconds
  timestamp: string
}
```

#### Scenario Output Schema

```typescript
{
  scenarioName: string,            // Descriptive scenario name
  scenarioType: string,            // Category: NATURAL_DISASTER, GEOPOLITICAL, etc.
  disruptionSeverity: number,      // Severity score 0-100
  disruptionDuration: number,      // Duration in days
  affectedNode: string,            // Primary affected node ID
  description: string,             // Detailed scenario description
  startDate: string,               // ISO date when scenario begins
  endDate: string,                 // ISO date when scenario ends
  monteCarloRuns: number,          // Number of simulation runs (1000-50000)
  distributionType: string,        // Statistical distribution type
  cascadeEnabled: boolean,         // Whether cascade failure is enabled
  failureThreshold: number,        // Node failure threshold (0-1)
  bufferPercent: number,           // Buffer capacity percentage
  alternateRouting: boolean,       // Whether alternate routing is available
  randomSeed: string,              // Seed for reproducible simulations
  impactMetrics: {
    costImpact: number,            // Estimated cost impact in USD
    timeImpact: number,            // Time delay impact in hours
    qualityImpact: number,         // Quality degradation percentage (0-100)
    customerImpact: number         // Customer satisfaction impact (0-100)
  },
  mitigationStrategies: string[], // Array of mitigation approaches
  probability: number,             // Likelihood of occurrence (0-1)
  urgency: string                  // Response urgency: LOW, MEDIUM, HIGH, CRITICAL
}
```

### GET `/api/agent/scenario`

Retrieve cached scenarios for a supply chain.

#### Query Parameters

- `supply_chain_id` (required): Supply chain ID
- `from_cache` (optional): Whether to return cached results (default: true)

## cURL Examples

### 1. Basic Scenario Generation

```bash
curl -X POST "http://localhost:3000/api/agent/scenario" \
  -H "Content-Type: application/json" \
  -d '{
    "supplyChainId": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

### 2. Custom Scenario Generation with Specific Parameters

```bash
curl -X POST "http://localhost:3000/api/agent/scenario" \
  -H "Content-Type: application/json" \
  -d '{
    "supplyChainId": "550e8400-e29b-41d4-a716-446655440000",
    "scenarioCount": 7,
    "timeHorizon": 60,
    "focusType": "CRITICAL_NODES",
    "customPrompt": "Generate scenarios focusing on climate-related disruptions including floods, hurricanes, and extreme weather events."
  }'
```

### 3. High-Risk Node Focus

```bash
curl -X POST "http://localhost:3000/api/agent/scenario" \
  -H "Content-Type: application/json" \
  -d '{
    "supplyChainId": "550e8400-e29b-41d4-a716-446655440000",
    "focusType": "HIGH_RISK",
    "scenarioCount": 5,
    "timeHorizon": 120
  }'
```

### 4. Force Cache Refresh

```bash
curl -X POST "http://localhost:3000/api/agent/scenario" \
  -H "Content-Type: application/json" \
  -d '{
    "supplyChainId": "550e8400-e29b-41d4-a716-446655440000",
    "forceRefresh": true,
    "includeHistorical": true
  }'
```

### 5. Custom Cybersecurity Scenarios

```bash
curl -X POST "http://localhost:3000/api/agent/scenario" \
  -H "Content-Type: application/json" \
  -d '{
    "supplyChainId": "550e8400-e29b-41d4-a716-446655440000",
    "customPrompt": "Generate cybersecurity-focused scenarios including ransomware attacks, data breaches, and IoT device compromises affecting supply chain operations.",
    "scenarioCount": 4,
    "focusType": "CRITICAL_NODES"
  }'
```

### 6. Geopolitical Risk Scenarios

```bash
curl -X POST "http://localhost:3000/api/agent/scenario" \
  -H "Content-Type: application/json" \
  -d '{
    "supplyChainId": "550e8400-e29b-41d4-a716-446655440000",
    "customPrompt": "Focus on geopolitical scenarios including trade wars, sanctions, border closures, and political instability affecting international supply chains.",
    "timeHorizon": 180,
    "scenarioCount": 6
  }'
```

### 7. Retrieve Cached Scenarios

```bash
curl -G "http://localhost:3000/api/agent/scenario" \
  --data-urlencode "supply_chain_id=550e8400-e29b-41d4-a716-446655440000" \
  --data-urlencode "from_cache=true"
```

### 8. Force Live Data (No Cache)

```bash
curl -G "http://localhost:3000/api/agent/scenario" \
  --data-urlencode "supply_chain_id=550e8400-e29b-41d4-a716-446655440000" \
  --data-urlencode "from_cache=false"
```

### 9. Financial Crisis Scenarios

```bash
curl -X POST "http://localhost:3000/api/agent/scenario" \
  -H "Content-Type: application/json" \
  -d '{
    "supplyChainId": "550e8400-e29b-41d4-a716-446655440000",
    "customPrompt": "Generate financial and economic disruption scenarios including: 1. Currency devaluation and exchange rate volatility 2. Credit crises affecting supplier financing 3. Inflation and commodity price spikes 4. Market crashes impacting demand. Include specific financial metrics and recovery timelines.",
    "scenarioCount": 5,
    "timeHorizon": 180,
    "focusType": "ALL"
  }'
```

### 10. Technology Infrastructure Failures

```bash
curl -X POST "http://localhost:3000/api/agent/scenario" \
  -H "Content-Type: application/json" \
  -d '{
    "supplyChainId": "550e8400-e29b-41d4-a716-446655440000",
    "customPrompt": "Focus on technology infrastructure failures: 1. Cloud service outages affecting ERP systems 2. Communication network failures 3. GPS and navigation system disruptions 4. IoT sensor networks going offline. Include technical recovery procedures and backup system activation.",
    "scenarioCount": 4,
    "focusType": "CRITICAL_NODES",
    "timeHorizon": 30
  }'
```

### 11. Regulatory and Compliance Scenarios

```bash
curl -X POST "http://localhost:3000/api/agent/scenario" \
  -H "Content-Type: application/json" \
  -d '{
    "supplyChainId": "550e8400-e29b-41d4-a716-446655440000",
    "customPrompt": "Generate regulatory compliance scenarios: 1. New safety regulations requiring immediate facility upgrades 2. Environmental compliance violations and shutdowns 3. Import/export regulation changes 4. Data privacy law impacts on operations. Include compliance timelines and cost estimates.",
    "scenarioCount": 6,
    "timeHorizon": 365
  }'
```

### 12. Pandemic and Health Crisis Scenarios

```bash
curl -X POST "http://localhost:3000/api/agent/scenario" \
  -H "Content-Type: application/json" \
  -d '{
    "supplyChainId": "550e8400-e29b-41d4-a716-446655440000",
    "customPrompt": "Create pandemic and health crisis scenarios: 1. New infectious disease outbreaks affecting workforce 2. Quarantine measures disrupting operations 3. Health safety protocol implementations 4. Medical supply shortages. Include workforce availability metrics and safety protocols.",
    "scenarioCount": 5,
    "focusType": "HIGH_RISK",
    "timeHorizon": 120
  }'
```

### 13. Minimal Request (Testing Defaults)

```bash
curl -X POST "http://localhost:3000/api/agent/scenario" \
  -H "Content-Type: application/json" \
  -d '{
    "supplyChainId": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

### 14. Maximum Scenarios with Extended Timeline

```bash
curl -X POST "http://localhost:3000/api/agent/scenario" \
  -H "Content-Type: application/json" \
  -d '{
    "supplyChainId": "550e8400-e29b-41d4-a716-446655440000",
    "scenarioCount": 10,
    "timeHorizon": 365,
    "focusType": "ALL",
    "includeHistorical": true,
    "forceRefresh": true
  }'
```

### 15. Health Check and Status

```bash
curl -G "http://localhost:3000/api/agent/scenario" \
  --data-urlencode "health=true"
```

## Response Examples

### Successful Scenario Generation

```json
{
  "success": true,
  "scenarios": [
    {
      "scenarioName": "Port of Shanghai Typhoon Disruption",
      "scenarioType": "NATURAL_DISASTER",
      "disruptionSeverity": 85,
      "disruptionDuration": 14,
      "affectedNode": "node_shanghai_port_001",
      "description": "Category 4 typhoon makes landfall near Shanghai, causing severe flooding and forcing port closure. Container handling operations suspended, affecting global shipping routes.",
      "startDate": "2025-07-15T00:00:00.000Z",
      "endDate": "2025-07-29T00:00:00.000Z",
      "monteCarloRuns": 25000,
      "distributionType": "lognormal",
      "cascadeEnabled": true,
      "failureThreshold": 0.3,
      "bufferPercent": 15,
      "alternateRouting": true,
      "randomSeed": "scenario-550e8400-e29b-41d4-a716-446655440000-1719014400000-0",
      "impactMetrics": {
        "costImpact": 45000000,
        "timeImpact": 336,
        "qualityImpact": 25,
        "customerImpact": 70
      },
      "mitigationStrategies": [
        "Activate alternate port routing through Ningbo and Qingdao",
        "Implement emergency inventory redistribution",
        "Negotiate expedited customs clearance at alternative ports",
        "Deploy emergency response teams for rapid recovery"
      ],
      "probability": 0.15,
      "urgency": "HIGH"
    }
  ],
  "fromCache": false,
  "generatedAt": "2025-06-22T10:30:00.000Z",
  "metadata": {
    "supplyChainId": "550e8400-e29b-41d4-a716-446655440000",
    "selectedNodes": ["node_shanghai_port_001", "node_factory_003", "node_warehouse_012"],
    "intelSourcesUsed": 8,
    "intelSource": "supabase",
    "focusType": "ALL",
    "timeHorizon": 90,
    "scenarioCount": 1
  },
  "processingTime": 3420,
  "timestamp": "2025-06-22T10:30:00.000Z"
}
```

### Error Response

```json
{
  "error": "Invalid request parameters",
  "details": [
    {
      "code": "too_small",
      "minimum": 3,
      "type": "number",
      "inclusive": true,
      "exact": false,
      "message": "Number must be greater than or equal to 3",
      "path": ["scenarioCount"]
    }
  ],
  "processingTime": 15
}
```

### Cache Hit Response

```json
{
  "success": true,
  "scenarios": [...],
  "fromCache": true,
  "generatedAt": "2025-06-22T09:45:00.000Z",
  "metadata": {...},
  "processingTime": 12
}
```

## Configuration

### Environment Variables

```env
# Required
MEM0_API_KEY=your_mem0_api_key
GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_key
UPSTASH_REDIS_URL=your_redis_url
UPSTASH_REDIS_TOKEN=your_redis_token
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key

# Optional
MEM0_ORG_ID=your_mem0_org_id
MEM0_PROJECT_ID=your_mem0_project_id
```

### Dependencies

```json
{
  "@mem0/vercel-ai-provider": "latest",
  "@ai-sdk/google": "latest",
  "ai": "latest",
  "zod": "latest",
  "@upstash/redis": "latest",
  "lodash": "latest",
  "@types/lodash": "latest"
}
```

## Advanced Usage

### Custom Prompt Engineering

The agent supports sophisticated custom prompts for specialized scenario types:

```bash
curl -X POST "http://localhost:3000/api/agent/scenario" \
  -H "Content-Type: application/json" \
  -d '{
    "supplyChainId": "your-supply-chain-id",
    "customPrompt": "You are a climate risk specialist. Generate scenarios focusing on:\n1. Sea level rise affecting coastal facilities\n2. Extreme heat events disrupting operations\n3. Water scarcity impacting manufacturing\n4. Regulatory changes due to climate policies\n\nEach scenario should include specific temperature thresholds, water availability metrics, and regulatory compliance requirements.",
    "scenarioCount": 4,
    "timeHorizon": 365
  }'
```

### Batch Processing Multiple Chains

```bash
# Process multiple supply chains in sequence
for chain_id in "chain1" "chain2" "chain3"; do
  curl -X POST "http://localhost:3000/api/agent/scenario" \
    -H "Content-Type: application/json" \
    -d "{\"supplyChainId\": \"$chain_id\", \"scenarioCount\": 3}" \
    -o "scenarios_$chain_id.json"
done
```

### PowerShell Batch Processing (Windows)

```powershell
# Process multiple supply chains using PowerShell
@("chain1", "chain2", "chain3") | ForEach-Object {
    $body = @{
        supplyChainId = $_
        scenarioCount = 3
        focusType = "ALL"
    } | ConvertTo-Json
    
    Invoke-RestMethod -Uri "http://localhost:3000/api/agent/scenario" `
                      -Method POST `
                      -Body $body `
                      -ContentType "application/json" `
                      -OutFile "scenarios_$_.json"
}
```

### Testing Different Focus Types

```bash
# Test all focus types for comprehensive analysis
focus_types=("ALL" "HIGH_RISK" "CRITICAL_NODES" "RANDOM")

for focus in "${focus_types[@]}"; do
  echo "Testing focus type: $focus"
  curl -X POST "http://localhost:3000/api/agent/scenario" \
    -H "Content-Type: application/json" \
    -d "{
      \"supplyChainId\": \"550e8400-e29b-41d4-a716-446655440000\",
      \"focusType\": \"$focus\",
      \"scenarioCount\": 3
    }" \
    -o "scenarios_focus_$focus.json"
  sleep 2  # Rate limiting delay
done
```

## Integration Examples

### JavaScript/TypeScript Integration

```typescript
import { ScenarioAgent } from './types/scenario-agent';

// Generate scenarios
async function generateScenarios(supplyChainId: string): Promise<ScenarioAgent.Response> {
  const response = await fetch('/api/agent/scenario', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      supplyChainId,
      scenarioCount: 5,
      focusType: 'ALL',
      timeHorizon: 90
    })
  });
  
  if (!response.ok) {
    throw new Error(`Scenario generation failed: ${response.statusText}`);
  }
  
  return response.json();
}

// Retrieve cached scenarios
async function getCachedScenarios(supplyChainId: string): Promise<ScenarioAgent.Response> {
  const params = new URLSearchParams({
    supply_chain_id: supplyChainId,
    from_cache: 'true'
  });
  
  const response = await fetch(`/api/agent/scenario?${params}`);
  return response.json();
}
```

### Python Integration

```python
import requests
import json

class ScenarioAgent:
    def __init__(self, base_url: str):
        self.base_url = base_url
    
    def generate_scenarios(self, supply_chain_id: str, **kwargs):
        """Generate new scenarios for a supply chain."""
        payload = {
            'supplyChainId': supply_chain_id,
            **kwargs
        }
        
        response = requests.post(
            f"{self.base_url}/api/agent/scenario",
            json=payload,
            headers={'Content-Type': 'application/json'}
        )
        
        response.raise_for_status()
        return response.json()
    
    def get_cached_scenarios(self, supply_chain_id: str):
        """Retrieve cached scenarios."""
        params = {
            'supply_chain_id': supply_chain_id,
            'from_cache': 'true'
        }
        
        response = requests.get(
            f"{self.base_url}/api/agent/scenario",
            params=params
        )
        
        response.raise_for_status()
        return response.json()

# Usage
agent = ScenarioAgent("http://localhost:3000")

# Generate climate-focused scenarios
scenarios = agent.generate_scenarios(
    supply_chain_id="your-chain-id",
    customPrompt="Focus on climate change impacts",
    scenarioCount=6,
    focusType="CRITICAL_NODES"
)
```

## Monitoring & Debugging

### Health Check

The agent includes built-in health monitoring. Check agent status:

```bash
curl "http://localhost:3000/api/agent/scenario?health=true"
```

### Performance Metrics

- **Cache Hit Rate**: Monitor Redis cache performance
- **Generation Time**: Track AI generation latency
- **Memory Usage**: Monitor Mem0 integration performance
- **Error Rates**: Track validation and generation failures

### Logging

The agent provides comprehensive logging:

```
[2025-06-22T10:30:00.000Z] Scenario generation request for chain: 550e8400-e29b-41d4-a716-446655440000
[2025-06-22T10:30:01.200Z] Found 8 intelligence records from supabase source
[2025-06-22T10:30:01.500Z] Selected 5 nodes for scenario generation: ["node1", "node2", ...]
[2025-06-22T10:30:04.800Z] Generated 5 scenarios for chain 550e8400-e29b-41d4-a716-446655440000
[2025-06-22T10:30:05.100Z] Successfully cached scenarios for chain 550e8400-e29b-41d4-a716-446655440000
```

## Error Handling

### Common Error Codes

- **400**: Invalid request parameters (Zod validation failure)
- **404**: Supply chain not found
- **500**: Internal server error (AI generation failure, database error)

### Rate Limiting

The agent respects AI API rate limits and implements intelligent backoff strategies.

### Fallback Strategies

- **Memory Unavailable**: Falls back to Supabase intelligence data
- **Cache Miss**: Generates fresh scenarios
- **AI Service Down**: Returns structured error with retry suggestions

## Best Practices

1. **Cache Management**: Use cache for frequent reads, force refresh for critical updates
2. **Custom Prompts**: Be specific and include domain expertise in custom prompts
3. **Node Selection**: Use appropriate focus types based on analysis goals
4. **Time Horizons**: Match time horizons to planning cycles (30-90 days for operational, 180-365 for strategic)
5. **Scenario Counts**: 3-5 scenarios for quick analysis, 7-10 for comprehensive planning
6. **Memory Integration**: Allow historical context to improve scenario realism

## Security Considerations

- All API keys should be stored securely in environment variables
- Validate all inputs to prevent injection attacks
- Monitor usage patterns for anomalies
- Implement proper authentication and authorization
- Log access patterns for audit purposes

## Production Deployment

### Docker Configuration

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Setup

```bash
# Production environment variables
export MEM0_API_KEY="prod_mem0_key"
export GOOGLE_GENERATIVE_AI_API_KEY="prod_google_key"
export UPSTASH_REDIS_URL="prod_redis_url"
export UPSTASH_REDIS_TOKEN="prod_redis_token"
```

### Scaling Considerations

- **Horizontal Scaling**: Agent is stateless and scales horizontally
- **Cache Sharing**: Redis cache shared across instances
- **Memory Persistence**: Mem0 provides cross-instance memory sharing
- **Rate Limiting**: Implement per-user rate limiting for production use

## Comprehensive Testing Suite

### cURL Testing Script

Save this as `test_scenario_agent.sh` for comprehensive testing:

```bash
#!/bin/bash

# Configuration
BASE_URL="http://localhost:3000"
SUPPLY_CHAIN_ID="550e8400-e29b-41d4-a716-446655440000"
OUTPUT_DIR="./scenario_test_results"

# Create output directory
mkdir -p "$OUTPUT_DIR"

echo "🚀 Starting Scenario Agent Comprehensive Test Suite"
echo "=================================================="

# Test 1: Basic functionality
echo "📋 Test 1: Basic scenario generation..."
curl -X POST "$BASE_URL/api/agent/scenario" \
  -H "Content-Type: application/json" \
  -d "{\"supplyChainId\": \"$SUPPLY_CHAIN_ID\"}" \
  -o "$OUTPUT_DIR/test1_basic.json" \
  -w "Status: %{http_code}, Time: %{time_total}s\n"

# Test 2: Custom parameters
echo "⚙️  Test 2: Custom parameters..."
curl -X POST "$BASE_URL/api/agent/scenario" \
  -H "Content-Type: application/json" \
  -d "{
    \"supplyChainId\": \"$SUPPLY_CHAIN_ID\",
    \"scenarioCount\": 7,
    \"timeHorizon\": 180,
    \"focusType\": \"HIGH_RISK\",
    \"forceRefresh\": true
  }" \
  -o "$OUTPUT_DIR/test2_custom.json" \
  -w "Status: %{http_code}, Time: %{time_total}s\n"

# Test 3: Climate scenarios
echo "🌡️  Test 3: Climate-focused scenarios..."
curl -X POST "$BASE_URL/api/agent/scenario" \
  -H "Content-Type: application/json" \
  -d "{
    \"supplyChainId\": \"$SUPPLY_CHAIN_ID\",
    \"customPrompt\": \"Generate climate change scenarios including extreme weather, rising sea levels, and temperature variations affecting supply chain operations.\",
    \"scenarioCount\": 5,
    \"focusType\": \"CRITICAL_NODES\"
  }" \
  -o "$OUTPUT_DIR/test3_climate.json" \
  -w "Status: %{http_code}, Time: %{time_total}s\n"

# Test 4: Cache retrieval
echo "💾 Test 4: Cache retrieval..."
curl -G "$BASE_URL/api/agent/scenario" \
  --data-urlencode "supply_chain_id=$SUPPLY_CHAIN_ID" \
  --data-urlencode "from_cache=true" \
  -o "$OUTPUT_DIR/test4_cache.json" \
  -w "Status: %{http_code}, Time: %{time_total}s\n"

# Test 5: Validation errors
echo "❌ Test 5: Validation error handling..."
curl -X POST "$BASE_URL/api/agent/scenario" \
  -H "Content-Type: application/json" \
  -d "{
    \"supplyChainId\": \"$SUPPLY_CHAIN_ID\",
    \"scenarioCount\": 15,
    \"timeHorizon\": 10
  }" \
  -o "$OUTPUT_DIR/test5_validation_error.json" \
  -w "Status: %{http_code}, Time: %{time_total}s\n"

# Test 6: All focus types
echo "🎯 Test 6: Testing all focus types..."
for focus in "ALL" "HIGH_RISK" "CRITICAL_NODES" "RANDOM"; do
  echo "  Testing focus: $focus"
  curl -X POST "$BASE_URL/api/agent/scenario" \
    -H "Content-Type: application/json" \
    -d "{
      \"supplyChainId\": \"$SUPPLY_CHAIN_ID\",
      \"focusType\": \"$focus\",
      \"scenarioCount\": 3
    }" \
    -o "$OUTPUT_DIR/test6_focus_$focus.json" \
    -w "Status: %{http_code}, Time: %{time_total}s\n"
  sleep 1
done

echo "✅ Test suite completed! Results saved in $OUTPUT_DIR"
echo "📊 Summary:"
echo "   - Check HTTP status codes in output"
echo "   - Review JSON responses for data quality"
echo "   - Verify cache behavior and performance"
```

### PowerShell Testing Script

Save this as `Test-ScenarioAgent.ps1` for Windows users:

```powershell
# Scenario Agent Testing Script for PowerShell
param(
    [string]$BaseUrl = "http://localhost:3000",
    [string]$SupplyChainId = "550e8400-e29b-41d4-a716-446655440000",
    [string]$OutputDir = "./scenario_test_results"
)

# Create output directory
New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

Write-Host "🚀 Starting Scenario Agent Test Suite" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green

# Test function
function Invoke-ScenarioTest {
    param(
        [string]$TestName,
        [string]$Method = "POST",
        [hashtable]$Body = $null,
        [string]$QueryString = "",
        [string]$OutputFile
    )
    
    Write-Host "📋 $TestName..." -ForegroundColor Yellow
    
    $uri = "$BaseUrl/api/agent/scenario$QueryString"
    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    
    try {
        if ($Method -eq "POST" -and $Body) {
            $jsonBody = $Body | ConvertTo-Json -Depth 10
            $response = Invoke-RestMethod -Uri $uri -Method $Method -Body $jsonBody -ContentType "application/json"
        } else {
            $response = Invoke-RestMethod -Uri $uri -Method $Method
        }
        
        $stopwatch.Stop()
        $response | ConvertTo-Json -Depth 10 | Out-File -FilePath "$OutputDir/$OutputFile"
        
        Write-Host "   ✅ Success - Time: $($stopwatch.ElapsedMilliseconds)ms" -ForegroundColor Green
        return $true
    }
    catch {
        $stopwatch.Stop()
        Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        $_.Exception | Out-File -FilePath "$OutputDir/$OutputFile"
        return $false
    }
}

# Run tests
$tests = @(
    @{
        Name = "Basic scenario generation"
        Body = @{ supplyChainId = $SupplyChainId }
        OutputFile = "test1_basic.json"
    },
    @{
        Name = "Custom parameters"
        Body = @{
            supplyChainId = $SupplyChainId
            scenarioCount = 7
            timeHorizon = 180
            focusType = "HIGH_RISK"
            forceRefresh = $true
        }
        OutputFile = "test2_custom.json"
    },
    @{
        Name = "Climate scenarios"
        Body = @{
            supplyChainId = $SupplyChainId
            customPrompt = "Generate climate change scenarios including extreme weather, rising sea levels, and temperature variations."
            scenarioCount = 5
            focusType = "CRITICAL_NODES"
        }
        OutputFile = "test3_climate.json"
    }
)

# Execute POST tests
foreach ($test in $tests) {
    Invoke-ScenarioTest -TestName $test.Name -Body $test.Body -OutputFile $test.OutputFile
    Start-Sleep -Seconds 1
}

# Execute GET test for cache
Invoke-ScenarioTest -TestName "Cache retrieval" -Method "GET" -QueryString "?supply_chain_id=$SupplyChainId&from_cache=true" -OutputFile "test4_cache.json"

Write-Host "✅ Test suite completed!" -ForegroundColor Green
Write-Host "📊 Results saved in: $OutputDir" -ForegroundColor Cyan
```