# Supply Chain Strategy Agent V2.0

## Overview

The Supply Chain Strategy Agent is a production-grade AI-powered agent that analyzes supply chain scenarios, impact assessments, and network topology to generate comprehensive mitigation strategies. It provides immediate, short-term, and long-term strategies with detailed implementation plans, cost estimates, and risk assessments.

## Features

### 🚀 Core Capabilities

1. **Comprehensive Strategy Generation**
   - Immediate response strategies (0-24 hours)
   - Short-term stabilization strategies (1-30 days)  
   - Long-term resilience strategies (30+ days)

2. **Real-time Market Intelligence**
   - Integration with Tavily Search API for industry insights
   - Market trend analysis and best practices research
   - Competitor analysis and case study integration

3. **Memory-Enhanced Context**
   - Mem0 integration for historical strategy performance
   - Learning from previous implementations
   - Context-aware recommendations based on past successes

4. **Database Integration**
   - Stores strategies in the `strategies` table
   - Links to simulations and supply chain data
   - Tracks implementation status and outcomes

5. **Advanced Caching**
   - Redis-based caching for performance optimization
   - Strategy result caching with TTL management
   - Force refresh capabilities for real-time updates

## API Endpoints

### GET `/api/agent/strategy`

Retrieve cached strategy analysis for a simulation.

**Parameters:**
- `simulationId` (required): ID of the simulation to analyze

**Example:**
```bash
curl -X GET "/api/agent/strategy?simulationId=sim-123"
```

### POST `/api/agent/strategy`

Generate new strategy analysis (with optional cache override).

**Body:**
```json
{
  "simulationId": "sim-123",
  "forceRefresh": false
}
```

**Example:**
```bash
curl -X POST "/api/agent/strategy" \
  -H "Content-Type: application/json" \
  -d '{"simulationId": "sim-123", "forceRefresh": true}'
```

## Response Format

The agent returns a comprehensive strategy analysis:

```json
{
  "success": true,
  "data": {
    "immediate": [
      {
        "id": 1,
        "title": "Activate Alternative Shipping Routes",
        "description": "Immediately redirect shipments through Hong Kong and Ningbo ports",
        "priority": "Critical",
        "timeframe": "0-24 hours",
        "costEstimate": "$120K",
        "impactReduction": "25%",
        "status": "ready",
        "category": "immediate",
        "feasibility": "HIGH",
        "dependencies": ["Port availability", "Logistics coordination"],
        "riskFactors": ["Weather conditions", "Port capacity"],
        "successMetrics": ["Shipment redirection rate", "Delivery time recovery"],
        "resourceRequirements": {
          "personnel": 5,
          "equipment": ["Communication systems", "Tracking software"],
          "partnerships": ["Alternative port operators", "Freight forwarders"]
        }
      }
    ],
    "shortTerm": [...],
    "longTerm": [...],
    "riskMitigationMetrics": {
      "currentRisk": 85,
      "targetRisk": 35,
      "costToImplement": "$8.1M",
      "expectedROI": "2.4x",
      "paybackPeriod": "18 months",
      "riskReduction": "50%"
    },
    "keyInsights": [...],
    "marketIntelligence": [...],
    "bestPractices": [...],
    "contingencyPlans": [...]
  },
  "processingTime": 3456,
  "enhanced": true,
  "memoryContextAvailable": true,
  "marketIntelligenceGathered": true
}
```

## Configuration

### Environment Variables

```env
# Required
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key
UPSTASH_REDIS_URL=your_redis_url
UPSTASH_REDIS_TOKEN=your_redis_token

# Optional but Recommended
MEM0_API_KEY=your_mem0_api_key
TAVILY_API_KEY=your_tavily_api_key

# Database (Supabase)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key
```

### Database Schema

The agent stores strategies in the `strategies` table:

```sql
CREATE TABLE strategies (
  strategy_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  simulation_id UUID REFERENCES simulations(simulation_id),
  strategy_title TEXT NOT NULL,
  description TEXT NOT NULL,
  details JSONB,
  estimated_roi DECIMAL,
  cost_estimate DECIMAL,
  risk_reduction DECIMAL,
  implementation_time TEXT,
  complexity TEXT,
  status TEXT,
  tags TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Strategy Categories

### Immediate Strategies (0-24 hours)
- Crisis response and damage control
- Emergency resource deployment
- Critical communication protocols
- Rapid decision making

### Short-term Strategies (1-30 days)
- Stabilization and recovery
- Alternative sourcing activation
- Production rescheduling
- Customer communication

### Long-term Strategies (30+ days)
- Resilience building
- Network diversification
- Infrastructure investment
- Process optimization

## AI Model Integration

The agent uses Google's Gemini 1.5 Pro with structured output generation:

- **Model**: `gemini-flash-lite-latest`
- **Temperature**: 0.2 (for consistent recommendations)
- **Max Tokens**: 6000 (for comprehensive analysis)
- **Structured Output**: Zod schema validation

## Memory Integration

### Mem0 Features
- Historical strategy performance tracking
- Success rate analysis from past implementations
- Context-aware recommendations
- Learning from supply chain patterns

### Memory Storage Format
```
SUPPLY CHAIN STRATEGY ANALYSIS:
- Scenario details and context
- Risk mitigation metrics
- Strategy implementation summary
- Success factors and lessons learned
```

## Market Intelligence

### Tavily Integration
- Real-time industry research
- Best practices discovery
- Case study analysis
- Market trend insights

### Search Domains
- McKinsey & Company
- Supply Chain Brain
- Logistics Management
- Reuters Business
- Bloomberg Supply Chain

## Performance Optimization

### Caching Strategy
- **Redis TTL**: 1 hour for strategy analysis
- **Cache Keys**: `strategy_analysis_v2:{simulationId}`
- **Force Refresh**: Available via API parameter

### Error Handling
- Graceful degradation when external APIs fail
- Fallback to cached data
- Comprehensive error logging
- Retry mechanisms with exponential backoff

## Testing

Use the test utilities in `__tests__/strategy-agent.test.ts`:

```typescript
import { testStrategyAgentGET, testStrategyAgentPOST, validateStrategyResult } from './__tests__/strategy-agent.test'

// Test GET endpoint
const result = await testStrategyAgentGET('your-simulation-id')

// Test POST endpoint with force refresh
const result = await testStrategyAgentPOST('your-simulation-id', true)

// Validate result format
const isValid = validateStrategyResult(result.data)
```

## Integration Examples

### Frontend Integration
```typescript
// React component example
const [strategies, setStrategies] = useState(null)

const loadStrategies = async (simulationId: string) => {
  try {
    const response = await fetch(`/api/agent/strategy?simulationId=${simulationId}`)
    const result = await response.json()
    
    if (result.success) {
      setStrategies(result.data)
    }
  } catch (error) {
    console.error('Failed to load strategies:', error)
  }
}
```

### Strategy Implementation Tracking
```typescript
// Update strategy status
const updateStrategyStatus = async (strategyId: string, status: string) => {
  await supabase
    .from('strategies')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('strategy_id', strategyId)
}
```

## Monitoring and Analytics

### Key Metrics
- Strategy generation time
- Cache hit rates  
- Memory context availability
- Market intelligence gathering success
- Database operation performance

### Logging
- Comprehensive console logging with emojis
- Error tracking and reporting
- Performance metrics
- API call tracking

## Security Considerations

- API key management through environment variables
- Rate limiting on external API calls
- Input validation and sanitization
- Database query parameterization
- Memory data privacy controls

## Future Enhancements

1. **Machine Learning Integration**
   - Strategy effectiveness prediction
   - Automated optimization
   - Pattern recognition

2. **Real-time Monitoring**
   - Live strategy performance tracking
   - Dynamic adjustments
   - Alert systems

3. **Integration Expansion**
   - Additional data sources
   - ERP system connections
   - IoT sensor data

4. **Advanced Analytics**
   - ROI optimization
   - Risk modeling
   - Scenario planning

## Support

For issues, enhancements, or questions:
1. Check the error logs for detailed information
2. Verify environment variable configuration
3. Test with the provided test utilities
4. Monitor Redis and database connections

## License

This strategy agent is part of the SupplyChain AI platform and follows the project's licensing terms.
