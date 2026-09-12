# Forecast Agent

The Forecast Agent is a modular AI system that generates detailed forecasts for supply chains and nodes. It follows a multi-step architecture:

1. **Data Ingestion**: Collects data from multiple sources including supply chain data, intelligence data, weather data, and news.
2. **Context Building**: Creates a comprehensive context for the LLM to generate forecasts from.
3. **Prompt Engineering**: Crafts an effective prompt for the LLM that includes all relevant context.
4. **LLM Invocation**: Uses Vercel AI SDK for structured output generation.
5. **Output Validation**: Validates and repairs the LLM output.
6. **Persistence**: Stores the forecast in the database.
7. **Response Formatting**: Formats the forecast for the client.

## Integration with Vercel AI SDK

The Forecast Agent leverages Vercel AI SDK's `generateObject` function for structured output generation. This approach:

1. Directly generates structured JSON output from the LLM without parsing from text
2. Handles validation against the JSON schema
3. Provides better typing and error handling
4. Allows for fallbacks between different AI providers

The agent supports two primary LLM providers:
- OpenAI (GPT-4 Turbo)
- Google AI (Gemini Pro)

## Usage

```typescript
import { forecastAgent, orchestrateForecastFlow } from './lib/agents/forecast';

// Option 1: Use the orchestration function
const forecast = await orchestrateForecastFlow({
  supplyChainId: "your-supply-chain-id",
  nodeId: "optional-node-id", 
  forecastHorizonDays: 30,
  includeWeather: true,
  includeMarketData: true,
  options: {
    forceRefresh: false,
    detailLevel: 'medium'
  }
});

// Option 2: Use the agent instance directly
const result = await forecastAgent.handleRequest({
  supplyChainId: "your-supply-chain-id",
  timeHorizon: 60
});
```

## Troubleshooting

If you encounter issues with forecast generation:

1. Check API keys for OpenAI and Google AI
2. Verify data sources are accessible
3. Look for validation errors in logs
4. Try with a smaller forecast horizon

## Environment Variables

- `OPENAI_API_KEY`: For using OpenAI models
- `GOOGLE_GENERATIVE_AI_API_KEY`: For using Google AI models
