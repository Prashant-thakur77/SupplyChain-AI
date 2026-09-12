# AI Agents, Prompts, and Dynamic Risk System Documentation

This document describes the architecture, implementation paths, prompt templates, injected context fields, and output schemas for all AI agents in the SupplyChain AI platform. It also outlines the Dynamic Risk Score Allocation and Background Alerting systems.

---

## 🗺️ Multi-Agent System Overview

The SupplyChain AI backend leverages a multi-agent structure powered by Google Gemini and Google's IQ AI ADK framework. The system consists of specialized agents coordinating to analyze supply chain networks, forecast disruptions, simulate scenarios, assess financial impacts, and recommend mitigation strategies.

```
                  ┌───────────────────────────────┐
                  │   Copilot Chat Orchestrator   │
                  └───────────────┬───────────────┘
                                  │ (Routes Queries)
        ┌─────────────────────────┼─────────────────────────┐
        ▼                         ▼                         ▼
┌───────────────┐         ┌───────────────┐         ┌───────────────┐
│ Impact Agent  │         │ Strategy Agent│         │Forecast Agent │
└───────────────┘         └───────────────┘         └───────────────┘
        ▲                         ▲                         ▲
        │                         │                         │
        └─────────────────────────┼─────────────────────────┘
                                  │ (Shared Graph & News Context)
                  ┌───────────────┴───────────────┐
                  │    Live Intel & News Poller   │
                  └───────────────────────────────┘
```

---

## 🤖 Agent Specifications

### 1. Strategy Generation Agent
- **File Location**: [strategy/route.ts](file:///c:/supplychain-ai/app/api/agent/strategy/route.ts)
- **Purpose**: Generates actionable immediate, short-term, and long-term mitigation plans, cost estimates, and risk reduction metrics.
- **Context Injected**:
  - `scenario`: Disruption scenario description.
  - `nodes`: Full supply chain node objects (ID, label, type, coordinates, data).
  - `edges`: Full supply chain edge/connection objects (source, target, transport mode, cost, etc.).
- **Prompt Snippet**:
  ```text
  You are a senior supply chain resilience strategist.

  Disruption scenario: [Scenario]
  Supply chain graph: [nodes and edges]

  Generate exactly 3 mitigation strategies with these timeframes:
  - "immediate": actions executable within 0–7 days.
  - "short": actions executable within 1–3 months.
  - "long": actions executable within 3–12 months.

  For each strategy:
  - Title: 3–6 words, specific to the disruption.
  - Description: concrete actions referencing the exact node names and 
    edge connections from the graph. No generic advice.
  - costEstimate: USD integer. Scale proportionally to the number of 
    affected nodes and their types (ports and factories carry higher 
    cost than warehouses or distributors).
  - riskReductionPct: integer 1–100. Estimate how much of the current 
    disruption impact this strategy eliminates if executed fully.
  - timeframe: exactly one of "immediate", "short", or "long".

  If the graph contains fewer than 3 affected nodes, keep cost estimates 
  conservative. If it contains more than 10 affected nodes, reflect 
  enterprise-scale costs. Do not fabricate node names not present in 
  the graph.
  ```
- **Expected Output Schema**:
  ```json
  {
    "strategies": [
      {
        "title": "Dual-Sourcing Supplier",
        "description": "Engage secondary distributor in Rotterdam to bypass Germany port closures.",
        "costEstimate": 150000,
        "riskReductionPct": 45,
        "timeframe": "short"
      }
    ]
  }
  ```

---

### 2. Disruption Forecasting Agent
- **File Location**: [forecast/route.ts](file:///c:/supplychain-ai/app/api/agent/forecast/route.ts)
- **Purpose**: Predicts potential future disruptions (natural disasters, strikes, cyber threats) based on node geographies.
- **Context Injected**:
  - `nodes`: Array of node configurations containing names, types, and locations.
- **Prompt Snippet**:
  ```text
  You are a supply chain risk intelligence analyst specializing in 
  predictive threat modeling.

  Supply chain nodes: [nodes]

  Generate 4–6 disruption forecasts. Each forecast must satisfy all 
  of the following:

  1. Geography: tied to a country or region where at least one node 
     in the list is located. Do not forecast events for regions absent 
     from the node list.

  2. Event type diversity: across the full set of forecasts, cover at 
     least 4 distinct categories — natural disaster, geopolitical, 
     labor action, infrastructure failure, and cyber threat. Do not 
     repeat the same event type more than twice.

  3. Severity (1–5): calibrate against real-world precedent.
     1 = minor delay, 2 = moderate disruption, 3 = significant loss,
     4 = severe regional impact, 5 = catastrophic and prolonged.

  4. Probability (0.00–1.00): ground the value in known regional 
     base rates — e.g., typhoon probability for Southeast Asia in 
     monsoon season is 0.55–0.75; port strike probability for 
     Western Europe is 0.15–0.30. Do not assign probability above 
     0.85 unless the event type and region have very high historical 
     frequency.

  5. estimatedDurationDays: based on comparable historical incidents 
     for that event type and region, not arbitrary.
  ```
- **Expected Output Schema**:
  ```json
  {
    "forecasts": [
      {
        "region": "Southeast Asia",
        "eventType": "Natural Disaster",
        "severity": 4,
        "probability": 0.65,
        "estimatedDurationDays": 14
      }
    ]
  }
  ```

---

### 3. Impact Assessment Agent
- **File Location**: [impact/route.ts](file:///c:/supplychain-ai/app/api/agent/impact/route.ts)
- **Purpose**: Calculates cascading financial, operational, and structural impacts downstream when a node fails.
- **Context Injected**:
  - `disruptedNode`: The node object that has failed.
  - `nodes`: Array of nodes.
  - `edges`: Directed relationships representing product/materials flow.
- **Prompt Snippet**:
  ```text
  You are a supply chain financial impact analyst.

  Disrupted node: [disruptedNode]
  Supply chain graph: [nodes and edges]

  Step 1 — Graph traversal: starting from the disrupted node, follow 
  edges in their directed downstream flow. Collect every node reachable 
  from the disrupted node, directly or transitively. Exclude upstream 
  nodes and nodes with no path to the disrupted node.

  Step 2 — Per-node assessment: for each downstream node found, assign:
  - impactType: the dominant effect of the disruption on that node.
    Use exactly one of: "delay", "capacityLoss", "shutdown", 
    "costIncrease".
    - "delay": node still functions but throughput is deferred.
    - "capacityLoss": node operates at reduced throughput.
    - "shutdown": node cannot operate until upstream is restored.
    - "costIncrease": node operational but at elevated cost.
  - estimatedLoss: USD integer. Scale by node type (port and factory 
    losses run higher than warehouse or retailer), graph hop distance 
    from the disrupted node (direct connections carry higher loss than 
    second or third-degree), and impactType severity 
    (shutdown > capacityLoss > delay > costIncrease).

  Step 3 — Totals:
  - totalCostImpact: sum of all estimatedLoss values.
  - operationalDaysLost: estimate based on impactType distribution 
    and graph depth. Shutdowns at depth 1 add more days than delays 
    at depth 3.

  Do not include the disrupted node itself in downstreamImpact.
  Do not include nodes unreachable from the disrupted node.
  ```
- **Expected Output Schema**:
  ```json
  {
    "totalCostImpact": 450000,
    "operationalDaysLost": 5,
    "downstreamImpact": [
      {
        "nodeId": "node-warehouse-3",
        "impactType": "capacityLoss",
        "estimatedLoss": 150000
      }
    ]
  }
  ```

---

### 4. Scenario Generator Agent
- **File Location**: [scenario/route.ts](file:///c:/supplychain-ai/app/api/agent/scenario/route.ts)
- **Purpose**: Generates realistic supply chain disruption scenarios including Monte Carlo parameters, severity levels, and cascade rules.
- **Context Injected**:
  - `supplyChainId`: The current network identifier.
  - `customPrompt` (optional): Human constraints.
  - `nodes` & `edges`: Active layout configuration.
- **Expected Output**:
  - Structured disruption simulation metadata including `disruptionSeverity` (0–100), `disruptionDuration` (days), `distributionType` (e.g. lognormal), and list of `mitigationStrategies`.

---

### 5. Copilot Chat Orchestrator
- **File Location**: [orchestrator/route.ts](file:///c:/supplychain-ai/app/api/agent/orchestrator/route.ts)
- **Purpose**: Parses free-form user chat queries and routes them to the appropriate specialized downstream AI agent.
- **Context Injected**:
  - `userQuery`: Raw text request.
  - `nodesData` / `edgesData`: Current canvas layout.
  - `history`: Recent conversation logs.
- **Prompt Snippet**:
  ```text
  You are the routing layer of a multi-agent supply chain platform.
  Your only output is a JSON routing decision. Do not answer the query.

  User query: "[userQuery]"
  Supply chain graph: [nodesData, edgesData, supplyChainAnalysis]
  Conversation history: [history]

  Routing rules — select the single best match:
  - "impact"             → query is about consequences, losses, or 
                           cascading effects of a node failure.
  - "strategy"           → query asks for mitigation plans, 
                           recommendations, or corrective actions.
  - "forecast"           → query asks about future risks, upcoming 
                           threats, or predictive analysis.
  - "scenario"           → query contains a hypothetical or what-if 
                           framing about changing the supply chain.
  - "live-intelligence"  → query asks about current news, live risk 
                           scores, or real-time conditions.
  - "route-optimization" → query asks about alternate paths, bypassing 
                           a failed node, or logistics rerouting.
  - "general"            → none of the above apply.

  Tiebreaker: if two agents are equally relevant, prefer the more 
  specific one (e.g., "impact" over "general", "route-optimization" 
  over "strategy").

  If the query references a specific node by name, locate its ID in 
  the graph and include it as `nodeId` in the payload.
  ```

---

### 6. Live Threat Intelligence & News Poller
- **File Location**: [news/route.ts](file:///c:/supplychain-ai/app/api/news/route.ts) & [news-polling/route.ts](file:///c:/supplychain-ai/app/api/agent/news-polling/route.ts)
- **Purpose**: Polls fresh supply chain disruption and logistics news from Tavily, extracts relevant threats, and updates the database notifications and node intelligence flags.
- **Rules & Bounds**:
  - Integrates Gemini search grounding or per-node news queries to extract factual signals.
  - Filters out generic news that cannot be mapped to the geographical locations or names of nodes in the user's digital twin canvas.

---

### 7. Node Info Extractor Agent
- **File Location**: [info/route.ts](file:///c:/supplychain-ai/app/api/agent/info/route.ts)
- **Purpose**: Gathers real-time intelligence for supply chain nodes, using Tavily search tools and generating summaries and quantitative risk scores (0–100).

---

### 8. Background Automated Alerts Agent
- **File Location**: [automated-alerts/route.ts](file:///c:/supplychain-ai/app/api/agent/automated-alerts/route.ts)
- **Purpose**: Continually evaluates whether incoming live threats exceed configured user risk thresholds to generate immediate high-priority warning alerts.
- **Context Injected**:
  - `topNodes`: Critical nodes sorted by risk levels.
  - `tavilyResults`: News headlines relevant to node locations.
- **Prompt Snippet**:
  ```text
  You are an expert AI Supply Chain Risk Analyst.
  
  I have a specific supply chain with the following critical nodes:
  [nodes]

  I have just pulled the latest live news potentially affecting these regions/components:
  [Tavily search results]

  Your task is to cross-reference the news with the supply chain nodes. 
  IF, and ONLY IF, a news article poses a direct or highly credible indirect threat to one or more of these specific nodes, generate an alert.
  If the news is general and doesn't clearly map to these specific nodes, do NOT generate an alert for it.
  
  Only return HIGH or CRITICAL severity alerts. If it's a minor delay, ignore it.
  ```

---

### 9. AI Suggestion Engines (System Suggestions & chips)
- **File Locations**: 
  - [suggestions/route.ts](file:///c:/supplychain-ai/app/api/suggestions/route.ts) (System-level suggestions payload)
  - [useAISuggestions.ts](file:///c:/supplychain-ai/components/digital-twin/layout/left-panel/assistant/useAISuggestions.ts) (Canvas general suggestion chips & chat autocompletion chips)
- **Purpose**: Generates context-rich, non-generic recommendations, actionable labels, and autocompletion chips based on current canvas node configurations and recent conversation history.

---

## 📈 Dynamic Risk Score Allocation System

To prevent generic or static risk assessments, SupplyChain AI allocates real-time risk scores using external Tavily search queries targeted at physical node locations.

### 1. Risk Score Bands (0.10 - 0.99)
- **0.10 – 0.30 (Stable / Normal)**: Node exhibits no active threats or weather signals. Operations continue normally.
- **0.31 – 0.50 (Minor Signals)**: Elevated regional weather alerts or minor shipping delays in the country. No immediate impact.
- **0.51 – 0.79 (Elevated Risk)**: Confirmed strikes, regional infrastructure delays, or storm forecasts within the node's metropolitan location.
- **0.80 – 0.99 (Critical Disruption)**: Direct, verified stoppage (e.g., port closure, warehouse fire, border shut down) affecting the node name.

### 2. Disruption Trigger Threshold
When any node risk score exceeds **0.80**, the system automatically flags the node's state. The Control Tower immediately:
1. Marks `disruptionsFound: true` on the simulation.
2. Triggers red pulsing indicator animations on the React Flow canvas node representing the physical failure.
3. Fires a background notification request to the Automated Alerts Agent.
