# Supply Chain Intelligence Agent: Architecture & Capabilities

## 1. Overview

The Supply Chain Intelligence info Agent is a production-grade, real-time intelligence system designed to monitor, analyze, and provide actionable insights for supply chain operations. Built on Google's Gemini LLM with enhanced memory, search, and weather capabilities, the agent provides comprehensive intelligence for individual nodes and entire supply chain networks.

## 2. Architectural Components

```
┌─────────────────────────┐     ┌───────────────────┐     ┌────────────────────┐
│                         │     │                   │     │                    │
│ Intelligence Agent API  │─────┤  Gemini 2.0 LLM   │─────┤ Structured Output  │
│ (GET/POST Endpoints)    │     │  (google-ai-sdk)  │     │ (Schema Validation)│
│                         │     │                   │     │                    │
└─────────────┬───────────┘     └───────────┬───────┘     └────────┬───────────┘
              │                             │                      │
              │                             │                      │
┌─────────────┴───────────┐     ┌───────────┴───────────────┐     │
│                         │     │                           │     │
│    Redis Caching        │     │     Data Sources          │     │
│    (Upstash Redis)      │     │  ┌───────────────────┐    │     │
│                         │     │  │  Tavily Search    │    │     │
└─────────────────────────┘     │  │  (Web Data)       │    │     │
                                │  └───────────────────┘    │     │
┌─────────────────────────┐     │  ┌───────────────────┐    │     │
│                         │     │  │  OpenWeather API  │    │     │
│ API Key Validation      │     │  │  (Location Data)  │    │     │
│ & Health Monitoring     │     │  └───────────────────┘    │     │
│                         │     │  ┌───────────────────┐    │     │
└─────────────────────────┘     │  │  Mem0 Memory      │    │     │
                                │  │  (Historical Data)│    │     │
┌─────────────────────────┐     │  └───────────────────┘    │     │
│                         │     │                           │     │
│ Quota Management        │     └───────────────┬───────────┘     │
│ System                  │                     │                 │
│                         │                     │                 │
└─────────────┬───────────┘     ┌───────────────┴───────────┐     │
              │                 │                           │     │
              │                 │  Supabase Storage         │     │
              └────────────────►│  (PostgreSQL)             │◄────┘
                                │                           │
                                └───────────────────────────┘
```

### 2.1 Core Components:

1. **API Endpoints**: 
   - `GET` for batch processing and health monitoring
   - `POST` for streaming intelligence and targeted queries

2. **LLM Processing Engine**:
   - Google Gemini 2.0 Flash model integration
   - Mem0-enhanced context awareness

3. **Data Source Integration**:
   - **Tavily Search**: Real-time web intelligence gathering
   - **OpenWeather API**: Location-specific weather forecasting
   - **Mem0**: Long-term memory system for trend analysis

4. **Processing & Analysis Systems**:
   - Structured output enforcement via Zod schema validation
   - Relationship mapping engine
   - Risk assessment calculator
   - Trend analysis system

5. **Infrastructure**:
   - Redis caching (Upstash)
   - PostgreSQL database (Supabase)
   - API key validation system
   - Fallback mechanisms for resilience
   - Quota management system

## 3. Functional Capabilities

### 3.1 Intelligence Gathering

The agent can:

- **Web Intelligence**: Search and analyze recent news, market events, and industry-specific data related to supply chain nodes
- **Weather Monitoring**: Retrieve and analyze weather forecasts for node locations to predict weather-related disruptions
- **Memory-Enhanced Analysis**: Access historical intelligence to identify trends and patterns over time
- **Geocoding**: Convert location names to coordinates for accurate weather and regional analysis
- **Multi-Source Fusion**: Combine data from disparate sources into coherent, structured intelligence

### 3.2 Risk Analysis

The agent provides:

- **Comprehensive Risk Assessment**: Calculate overall risk scores (0-100) for each node and supply chain
- **Critical Event Detection**: Identify and prioritize high-impact events affecting supply chain operations
- **Risk Factor Decomposition**: Break down risks into specific factors with impact and probability scores
- **Quality Scoring**: Evaluate intelligence quality based on source credibility, confidence levels, and diversity
- **Mitigation Recommendations**: Generate actionable suggestions to address identified risks

### 3.3 Relationship Mapping

The agent creates:

- **Causal Link Analysis**: Map relationships between events, entities, and supply chain nodes
- **Impact Strength Assessment**: Quantify relationship strengths on a 0.0-1.0 scale based on confidence
- **Context-Rich Connections**: Provide explanatory context for each relationship
- **Primary/Secondary Impact Differentiation**: Distinguish between direct and indirect effects on supply chain

### 3.4 Market Intelligence

The agent tracks:

- **Price Fluctuations**: Monitor commodity price changes with magnitude and explanations
- **Demand Shifts**: Identify market demand patterns affecting the supply chain
- **Competitor Activities**: Track relevant actions by competitors that impact supply chain dynamics
- **Industry-Specific Metrics**: Gather metrics relevant to particular industries and node types

### 3.5 Adaptive Intelligence

The agent incorporates:

- **Dynamic Update Scheduling**: Adjust refresh rates based on risk levels and event criticality
- **Node Prioritization**: Intelligently process high-priority nodes (ports, factories, warehouses) first
- **Trend Analysis**: Calculate and explain risk deltas and event patterns over time
- **Confidence-Based Decisioning**: Include confidence scores for all intelligence assessments

## 4. Resilience Features

### 4.1 Fallback Mechanisms

- **Partial Data Operation**: Continue functioning when some APIs are unavailable
- **Weather Estimation**: Generate reasonable weather estimates based on coordinates when weather API fails
- **Generic Intelligence**: Provide minimum viable intelligence when critical APIs are unavailable
- **Error Recovery**: Handle API timeouts, rate limits, and service failures gracefully

### 4.2 Quota Management

- **API Call Limiting**: Restrict to 5 full intelligence calls per hour to manage costs
- **Call Counter Reset**: Automatic quota reset every hour
- **Status Reporting**: Provide remaining calls and time until reset

### 4.3 API Key Validation

- **Comprehensive Validation**: Test all API keys before processing
- **Status Categorization**: Distinguish between critical and optional services
- **Recommendations Generator**: Provide specific suggestions for fixing API key issues
- **Detailed Error Information**: Show specific error types for easier troubleshooting

## 5. Memory & Learning System

### 5.1 Mem0 Integration

- **User-Scoped Memory**: Store intelligence linked to specific node IDs
- **Structured Memory Storage**: Format memories for optimal future retrieval
- **Memory Retrieval**: Search and recall relevant historical intelligence
- **Memory Analysis**: Extract risk and event trends from historical data

### 5.2 Trend Tracking

- **Risk Score Deltas**: Calculate changes in risk scores over time
- **Event Frequency Analysis**: Track patterns in critical event occurrences
- **Pattern Recognition**: Identify recurring issues versus new developments
- **Historical Record Maintenance**: Archive intelligence for long-term pattern analysis

## 6. Data Storage & Caching

### 6.1 Database Structure

- **Primary Intelligence Table**: `supply_chain_intel` for current node intelligence
- **Archive Table**: `supply_chain_intel_archive` for historical data
- **Metrics Table**: `intel_agent_metrics` for performance tracking
- **Indexes**: Optimized for searching by risk, quality, node, and timestamp

### 6.2 Caching System

- **Redis Integration**: Caching intelligence for 30-minute periods
- **Format Flexibility**: Handle both string and object data formats
- **Cache Invalidation**: Automatic refresh for outdated intelligence

## 7. API Endpoints & Integration

### 7.1 REST Endpoints

- **GET /api/agent/info**: Batch intelligence retrieval with filtering options
- **GET /api/agent/info?health=true**: Health check and API validation
- **POST /api/agent/info**: Streaming intelligence with interactive tool use

### 7.2 Streaming Capabilities

- **Real-Time Analysis**: Stream intelligence as it's gathered
- **Tool-Augmented Reasoning**: Use tools within streaming session
- **Memory Storage**: Store generated intelligence during streaming

### 7.3 Parameters

- **supply_chain_id**: Target supply chain (required)
- **node_id**: Specific node (optional)
- **force_refresh**: Bypass cache for fresh intelligence
- **get_memories**: Retrieve memory history for a node
- **stream**: Enable streaming mode for interactive analysis
- **query**: Customize intelligence focus in streaming mode

## 8. Output Schema

The intelligence output follows a strict schema:

```typescript
{
  nodeId: string,
  timestamp: string,
  intelligence: {
    criticalEvents: [
      {
        title: string,
        summary: string,
        severity: number, // 0-100
        impact: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
        category: 'WEATHER' | 'GEOPOLITICAL' | 'OPERATIONAL' | 'REGULATORY' | 'ECONOMIC' | 'SECURITY',
        affectedEntities: string[],
        timeframe: string,
        confidence: number, // 0-1
        sources: [
          {
            title: string,
            url: string,
            publishedAt: string,
            credibility: number // 0-1
          }
        ]
      }
    ],
    marketIntelligence: {
      priceFluctuations: [
        {
          commodity: string,
          change: number,
          reason: string
        }
      ],
      demandShifts: string[],
      competitorActivities: string[]
    },
    riskAssessment: {
      overallRiskScore: number, // 0-100
      riskFactors: [
        {
          factor: string,
          probability: number, // 0-1
          impact: number // 0-100
        }
      ],
      mitigationSuggestions: string[]
    },
    relationshipMapping: [
      {
        source: string,
        target: string,
        relationship: string,
        strength: number, // 0-1
        context: string
      }
    ]
  },
  metadata: {
    processingTime: number,
    sourcesChecked: number,
    qualityScore: number, // 0-1
    nextUpdateRecommended: string,
    memoryContext: boolean
  }
}
```

## 9. Development & Integration Roadmap

### 9.1 Current Capabilities

- ✅ Multi-source intelligence fusion
- ✅ Structured output with comprehensive schema
- ✅ Memory-enhanced analysis with trend detection
- ✅ Real-time weather impact assessment
- ✅ Robust fallback and error handling
- ✅ Quota management and cost optimization
- ✅ Relationship mapping between nodes and events
- ✅ Streaming intelligence with interactive tools

### 9.2 Future Enhancements

- 🔄 Enhanced predictive analytics for proactive risk management
- 🔄 Deeper causal reasoning for complex supply chain events
- 🔄 Improved entity extraction for more precise relationship mapping
- 🔄 Integration with additional data sources (e.g., economic indicators, social media)
- 🔄 Advanced machine learning for pattern identification
- 🔄 Industry-specific intelligence modules (e.g., semiconductor, automotive, retail)

## 10. Implementation Requirements

### 10.1 Environment Variables

```
# Required APIs
GOOGLE_GENERATIVE_AI_API_KEY=your_google_api_key_here
TAVILY_API_KEY=your_tavily_api_key_here
OPENWEATHER_API_KEY=your_openweather_api_key_here

# Optional but recommended for enhanced features
MEM0_API_KEY=your_mem0_api_key_here
UPSTASH_REDIS_URL=your_upstash_redis_url
UPSTASH_REDIS_TOKEN=your_upstash_redis_token

# Database configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 10.2 Database Setup

Database migrations in `/migrations/03_supply_chain_intelligence.sql` create the necessary tables:

- `supply_chain_intel`: Main intelligence storage
- `supply_chain_intel_archive`: Historical intelligence records
- `intel_agent_metrics`: Performance monitoring

## 11. Operational Considerations

### 11.1 API Cost Management

- **Quota System**: 5 calls per hour limit to manage API costs
- **Caching Strategy**: 30-minute TTL for intelligence caching
- **Search Optimization**: Minimal but sufficient web searches per request
- **Request Batching**: Process multiple nodes in one supply chain call

### 11.2 Performance Optimization

- **Node Prioritization**: Process critical nodes first (ports, factories, warehouses)
- **Rate Limiting**: Delays between API calls to avoid rate limiting
- **Minimal Token Usage**: Truncate search results to essential information
- **Quality vs. Speed Tradeoffs**: Adjustable search depth based on needs

### 11.3 Error Handling

- **Graceful Degradation**: Continue with partial data when some sources fail
- **Retry Logic**: Intelligent retries with exponential backoff
- **Error Reporting**: Clear error messages with actionable recommendations
- **Health Checks**: Comprehensive system health endpoint

## 12. Conclusion

The Supply Chain Intelligence Agent represents a state-of-the-art approach to supply chain risk monitoring, combining real-time data fusion, advanced LLM processing, and comprehensive analysis into a resilient, production-ready system. By integrating multiple data sources with memory-enhanced AI analysis, the agent provides actionable intelligence that can significantly improve supply chain resilience and decision making.
