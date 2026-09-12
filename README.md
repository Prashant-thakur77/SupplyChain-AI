<p align="center">
  <h1 align="center">🔷 SupplyChain AI</h1>
  <p align="center"><strong>Autonomous supply chain resilience — sense, decide, reroute</strong></p>
  <p align="center">
    An AI-powered supply chain digital twin platform built on <strong>Google ADK</strong> with autonomous multi-agent orchestration, real-time weather & geopolitical intelligence, chaos simulation, and strategic decision-making.
  </p>
</p>

---

## ✨ Overview

**SupplyChain AI** is a next-generation supply chain intelligence platform that combines **autonomous AI agents**, **digital twin visualization**, and **multi-agent orchestration** to help businesses proactively identify, assess, and mitigate supply chain risks before they cause damage.

Built on **Next.js 16** with **Google Gemini 2.5 Flash** and the **Google Agentic Development Kit (ADK)**, the platform provides an immersive experience for supply chain professionals to model their networks, simulate disruptions, and receive actionable intelligence — all autonomously and in real time.

**Deployed on Google Cloud Run** via a multi-stage Dockerized pipeline for production-grade scalability.

---

## 🚀 Key Features

### 🗺️ Interactive Digital Twin & Copilot
- Interactive supply chain network visualization using **React Flow** with drag-and-drop node management (suppliers, factories, warehouses, distributors, retailers)
- Real-time connection mapping with transport modes, costs, and risk multipliers
- Geographic mapping with **Leaflet** integration showing live node positions
- **Live Status Monitoring**: Nodes dynamically change state and appearance based on real-time intelligence, risk levels, and active disruptions
- **CopilotKit Integration**: A natural language AI copilot embedded directly in the digital twin — query your supply chain health, ask for risk summaries, and get instant answers conversationally

### 🤖 Autonomous Multi-Agent AI System (Google ADK)
Thirteen specialized AI agents powered by **Google Gemini 2.5 Flash** via the **Google ADK** (`@google/adk`) framework, operating both on-demand and autonomously in the background:

| Agent | Type | Purpose |
|-------|------|---------|
| **Intelligence** | On-demand | Gathers real-time news, weather, and market intelligence via **Tavily** web search |
| **Forecast** | On-demand | Predictive analytics and trend analysis using historical data with persistent storage |
| **Scenario** | On-demand | What-if modeling and disruption simulation generation |
| **Impact** | On-demand | Quantitative risk assessment and financial impact scoring |
| **Strategy** | On-demand | Mitigation planning and strategic recommendations with execution tracking |
| **Strategy Execution** | On-demand | Tracks and monitors the implementation of approved strategies |
| **Orchestrator** | On-demand | Coordinates all agents for comprehensive multi-step analysis |
| **Route Optimization** | On-demand | Calculates optimal alternate transit paths when nodes fail, using graph traversal |
| **Automated Alerts** | Autonomous | Continuously scans global news (Tavily) every 3 minutes, correlating threats to specific supply chain nodes with AI-powered severity classification |
| **Weather Intelligence** | Autonomous | Scans all node coordinates and transit route midpoints via OpenWeather API every 3 hours, classifying adverse conditions with AI severity assessment |
| **News Polling** | Autonomous | Fetches and deduplicates breaking supply chain news every 2 minutes with URL-level deduplication |
| **News Simulation** | On-demand | Generates AI-powered news impact scenarios for simulation exercises |
| **Live Intelligence** | On-demand | Real-time intelligence gathering for specific nodes and regions |

#### Agent Infrastructure
- **Tracing & Observability**: Every agent execution is wrapped in `withTrace()`, logging session ID, duration, success/failure, and token usage to the `agent_traces` table in Supabase
- **Audit Logging**: All agent actions are recorded in the `audit_logs` table via a fire-and-forget `logAudit()` pipeline for full accountability
- **Multi-Level Deduplication**: URL-based, node-based, and content-based deduplication prevents notification spam across all autonomous agents
- **Deterministic Cooldowns**: Both in-memory timers and database-timestamp checks prevent redundant API calls
- **Intelligent Rate-Limit Fallbacks**: If Gemini API quota is exhausted, agents automatically fall back to playbook-based mitigation strategies instead of failing, ensuring 100% operational uptime


### 🔬 Simulation & Chaos Engine
- Monte Carlo risk simulations with multi-variable sensitivity analysis
- Disruption scenario modeling with template-based and custom configurations
- **Professional Template Library**: Pre-built disruption templates (port closure, supplier bankruptcy, natural disaster, etc.)
- Inject artificial disruptions (latency, price spikes, node failures) and watch the digital twin react in real-time with pulsing red states
- **Cascading Failure Maps**: Visualize how a single node failure propagates through the entire supply chain graph
- **Strategy Finalization**: Approved mitigation strategies are tracked through implementation with execution roadmaps
- **Forecast Scenarios**: AI-generated forward-looking risk projections persisted to Supabase for longitudinal analysis

### 📰 News Room & Timeline
- **Chronological Timeline**: All intelligence (geopolitical threats, weather alerts, live news) organized in a time-ordered, scrollable feed
- **Chain Segregation**: Alerts are strictly isolated to their affected supply chain — no cross-contamination between chains
- **Smart Severity Filtering**: Defaults to showing only `CRITICAL` and `HIGH` impact events; `MEDIUM` and `LOW` accessible via dropdown selector
- **Alert Detail Sheets**: Click any timeline event to open a full analysis sheet with source citations, affected nodes, credibility scores, and AI-generated impact summaries
- **Category Tags**: Events are tagged as `GEOPOLITICAL`, `WEATHER`, `Live News`, or `Supply Chain Alert` for instant visual classification

### 📊 Dashboard & Analytics
- Real-time supply chain health metrics with trend indicators
- Risk score visualization with **Recharts** and **D3.js**
- **Notification Feed**: Live-streaming threat alerts with read/unread state management and optimistic UI updates
- **Activity Log**: Full audit trail of all agent actions, user operations, and system events fetched from the `audit_logs` table
- Strategy execution tracking with progress monitoring

### 🧠 Memory & Trend Analysis
- **Mem0 Integration**: Persistent memory layer that remembers past disruptions and intelligence to identify longitudinal patterns
- **ADK Session Memory**: Agent sessions maintain context across interactions for smarter, contextual responses
- **Delta Risk Calculation**: Compares current risk levels against historical baselines to highlight escalating threats
- **Pattern Recognition**: Detects recurring failure points in the supply chain lifecycle

---

## 🏗️ Architecture

```
supplychain-ai/
├── app/
│   ├── (main)/                         # Authenticated routes
│   │   ├── dashboard/                  # Analytics dashboard + notification feed
│   │   ├── digital-twin/              # Supply chain visualization + Copilot
│   │   │   └── view/[id]/             # Individual twin view (dynamic route)
│   │   ├── news-room/                 # Segregated intelligence timeline
│   │   ├── risk-prediction/           # Risk prediction UI
│   │   ├── simulation/                # Chaos simulation engine
│   │   │   ├── mitigationstrategy/    # Strategy execution dashboard
│   │   │   └── result/                # Simulation results view
│   │   └── profile/                   # User profile management
│   ├── api/
│   │   ├── agent/                     # AI Agent endpoints (13 agents)
│   │   │   ├── automated-alerts/      # Autonomous threat scanner
│   │   │   ├── weather-intelligence/  # Autonomous weather monitor
│   │   │   ├── news-polling/          # Autonomous news fetcher
│   │   │   ├── news-simulation/       # News impact simulator
│   │   │   ├── live-intelligence/     # Real-time intelligence
│   │   │   ├── forecast/              # Forecasting agent
│   │   │   ├── impact/                # Impact assessment agent
│   │   │   ├── info/                  # Intelligence gathering agent
│   │   │   ├── orchestrator/          # Multi-agent orchestrator
│   │   │   ├── route-optimization/    # Route optimization agent
│   │   │   ├── scenario/              # Scenario generation agent
│   │   │   ├── strategy/              # Strategy planning agent
│   │   │   │   └── finalize/          # Strategy finalization
│   │   │   └── strategy-execution/    # Strategy execution tracker
│   │   ├── audit-logs/                # Audit log retrieval API
│   │   ├── risk-prediction/           # Risk prediction proxy
│   │   ├── coordination/             # Agent coordination layer
│   │   ├── copilotkit*/               # CopilotKit chat endpoints (3 variants)
│   │   ├── forecast-scenarios/        # Forecast scenario persistence
│   │   ├── news/                      # News management API
│   │   ├── suggestions/               # AI suggestion engine
│   │   └── strategy/                  # Strategy listing & execution
│   ├── auth/                          # Auth callback handlers
│   └── signin/                        # Authentication UI
├── components/
│   ├── digital-twin/                  # Twin visualization components
│   │   ├── canvas/                    # React Flow canvas components
│   │   ├── display/                   # Node display components
│   │   ├── forms/                     # Node/edge creation forms
│   │   ├── layout/                    # Layout components
│   │   └── utils/                     # Graph utility functions
│   ├── simulation/                    # Simulation UI (16 components)
│   │   ├── simulation-page.tsx        # Main simulation orchestrator
│   │   ├── professional-template-selection.tsx
│   │   ├── enhanced-scenario-configuration-form.tsx
│   │   ├── forecast-scenarios.tsx     # AI forecast visualization
│   │   ├── FinalizeStrategyPanel.tsx  # Strategy approval UI
│   │   └── ImplementationRoadmapPanel.tsx
│   ├── news-room/                     # News Room components
│   │   ├── timeline-event-card.tsx    # Individual event rendering
│   │   ├── alert-details-sheet.tsx    # Full alert detail modal
│   │   └── news-room-header.tsx       # Severity filter controls
│   ├── dashboard/                     # Dashboard widgets
│   │   ├── notification-feed/         # Live notification feed
│   │   └── dashboard-page.tsx         # Main dashboard view
│   ├── risk-prediction/              # Risk prediction components
│   ├── orchestrator/                  # Agent orchestration UI
│   ├── copilot/                       # CopilotKit chat interface
│   ├── strategy-dashboard.tsx         # Strategy management view
│   ├── cascading-failure-map.tsx      # Failure propagation visualization
│   ├── node-impact-grid.tsx           # Node impact assessment grid
│   └── ui/                            # shadcn/ui component library
├── lib/
│   ├── adk/                           # Google ADK integration layer
│   │   ├── core/
│   │   │   ├── trace.ts               # Agent tracing & observability
│   │   │   └── session.ts             # Session state management
│   │   ├── mcp/                       # Model Context Protocol adapters
│   │   └── types.ts                   # ADK type definitions
│   ├── ai-config.ts                   # Centralized AI model & key configuration
│   ├── audit-logger.ts                # Audit logging pipeline (fire-and-forget)
│   ├── supabase/                      # Supabase client setup (anon + service role)
│   ├── clients/                       # External API client wrappers
│   ├── stores/                        # Zustand state management
│   ├── monitoring.ts                  # Sentry + custom observability
│   ├── digitalTwinStore.ts            # Digital twin state store
│   ├── template-selector.ts           # Simulation template engine
│   ├── seed-data.ts                   # Demo data seeding
│   ├── fixed-tavily.ts                # Tavily API wrapper with error handling
│   ├── zod-patch.ts                   # Zod 3.25 ↔ ADK compatibility shim
│   └── validation/                    # Input validation schemas
├── types/
│   └── supply-chain.ts                # Core TypeScript type definitions
├── constants/                         # Application constants
├── hooks/                             # Custom React hooks
├── utils/                             # Shared utility functions
├── scripts/                           # Build & deployment scripts
├── supabase/                          # Supabase migrations
├── public/                            # Static assets
├── Dockerfile                         # Multi-stage Docker build for Cloud Run
├── instrumentation.ts                 # Sentry server-side instrumentation
└── instrumentation-client.ts          # Sentry client-side instrumentation
```

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 16.2.4 (App Router, Turbopack) |
| **Language** | TypeScript 5 |
| **AI Models** | Google Gemini 2.5 Flash (with 1.5 Flash quota fallbacks) |
| **Agent Framework** | Google ADK (`@google/adk` v1.2.0) for autonomous agent orchestration |
| **AI Chat Interface** | CopilotKit (`@copilotkit/react-core`, `@copilotkit/runtime`) |

| **Database** | Supabase (PostgreSQL with Row Level Security) |
| **Caching** | Upstash Redis |
| **Intelligence APIs** | Tavily API (real-time global news), OpenWeather API (live weather) |
| **Memory** | Mem0 AI (persistent disruption memory) |
| **UI Components** | shadcn/ui + Radix UI primitives |
| **Styling** | Tailwind CSS 3.4 |
| **Animations** | GSAP 3.15, Framer Motion |
| **Visualization** | React Flow (interactive node graph), Recharts, D3.js, Leaflet Maps |
| **State Management** | Zustand |
| **Monitoring** | Sentry (server + client + edge instrumentation) |
| **Validation** | Zod 3.25 (with v4-mini compatibility shim for ADK) |
| **Deployment** | Google Cloud Run (Dockerized multi-stage build) |
| **Container** | Docker (Node 22 Alpine, standalone output) |
| **Package Manager** | pnpm 11.5.2 |

---

## 🗄️ Database Schema

SupplyChain AI uses **Supabase PostgreSQL** with the following key tables:

| Table | Purpose |
|-------|---------|
| `supply_chains` | User-created supply chain definitions |
| `nodes` | Supply chain nodes (suppliers, factories, warehouses, etc.) |
| `edges` | Connections between nodes (routes, transport modes, costs) |
| `notifications` | All alerts, news, and intelligence events (live news, weather, threats) |
| `forecasts` | AI-generated forecast data with risk scores, weather, news, and market data |
| `weather_intelligence` | Live weather data for all node coordinates and transit midpoints |
| `audit_logs` | Complete audit trail of all agent and user actions |
| `agent_traces` | Agent execution observability (session, duration, success/failure) |
| `sessions` | ADK session state persistence for agent memory |
| `agent_queue` | Agent-to-Agent (A2A) communication queue |
| `pending_approvals` | Human-in-the-loop strategy approval workflow |

All tables enforce **Row Level Security (RLS)** so users can only access their own data.

---

## ⚡ Getting Started

### Prerequisites

- **Node.js** ≥ 22
- **Python** ≥ 3.10 (for the ML risk prediction API)
- **pnpm** 11+ (recommended)
- **Docker** (for Cloud Run deployment)
- API keys for required services (see Environment Variables)

### Installation

```bash
# Clone the repository
git clone https://github.com/Prashant-thakur77/SupplyChain-AI.git
cd supplychain-ai

# Install dependencies
pnpm install

# Start the development server (Turbopack)
pnpm dev
```

### ML Risk Prediction API

```bash
# Navigate to the ML directory
cd ../Market-Supply

# Install Python dependencies
pip install xgboost scikit-learn pandas numpy fastapi uvicorn python-multipart joblib shap

# Train the model (first time only, ~7s on GPU)
python ml/train.py

# Start the FastAPI server
uvicorn api.main:app --reload --port 8001
```

The Next.js app at **http://localhost:3000** and the ML API at **http://localhost:8001** must run simultaneously.

### Environment Setup

Create a `.env` file in the root directory:

```env
# ─── Supabase ────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# ─── AI Services (Required) ─────────────────────────
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key
GOOGLE_API_KEY=your_google_api_key

# ─── Multi-Key Quota Management (Optional) ──────────
GOOGLE_API_KEY_ORCHESTRATOR=your_key
GOOGLE_API_KEY_AGENTS=your_key
GOOGLE_API_KEY_DIGITAL_TWIN=your_key
GOOGLE_API_KEY_SUGGESTIONS=your_key

# ─── Intelligence APIs ──────────────────────────────
TAVILY_API_KEY=your_tavily_key
OPENWEATHER_API_KEY=your_openweather_key

# ─── Memory ─────────────────────────────────────────
MEM0_API_KEY=your_mem0_key

# ─── Caching ────────────────────────────────────────
UPSTASH_REDIS_URL=your_redis_url
UPSTASH_REDIS_TOKEN=your_redis_token

# ─── Monitoring (Optional) ──────────────────────────
SENTRY_DSN=your_sentry_dsn
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn

# ─── CopilotKit ─────────────────────────────────────
NEXT_PUBLIC_COPILOTKIT_ENABLED=true

# ─── ML Risk Prediction API ─────────────────────────
RISK_MODEL_API_URL=http://localhost:8001
```

---

## 🐳 Deployment (Google Cloud Run)

SupplyChain AI uses a multi-stage Docker build optimized for production:

```bash
# Build the Docker image
docker build -t supplychain-ai .

# Run locally
docker run -p 3000:3000 --env-file .env supplychain-ai

# Deploy to Google Cloud Run
gcloud run deploy supplychain-ai \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=production"
```

The Dockerfile uses:
- **Node 22 Alpine** base image for minimal footprint
- **Multi-stage build** (deps → builder → runner) for optimized image size
- **Standalone output** mode from Next.js for minimal production bundle
- **Non-root user** (`nextjs:nodejs`) for security

---

## 📡 API Reference

### Agent Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/agent/automated-alerts` | Autonomous threat scan for a specific supply chain |
| `POST` | `/api/agent/weather-intelligence` | Weather scan across all nodes & transit midpoints |
| `GET` | `/api/agent/news-polling` | Fetch and deduplicate breaking supply chain news |
| `POST` | `/api/agent/forecast` | Generate predictive supply chain forecasts |
| `GET` | `/api/agent/forecast` | Retrieve cached forecasts |
| `POST` | `/api/agent/orchestrator` | Multi-agent coordinated analysis |
| `POST` | `/api/agent/impact` | Quantitative risk impact assessment |
| `POST` | `/api/agent/scenario` | Disruption scenario generation |
| `POST` | `/api/agent/strategy` | Mitigation strategy planning |
| `POST` | `/api/agent/strategy/finalize` | Finalize and approve a strategy |
| `POST` | `/api/agent/strategy-execution` | Track strategy execution progress |
| `POST` | `/api/agent/route-optimization` | Calculate alternate routes around failed nodes |
| `POST` | `/api/agent/info` | Intelligence gathering & node analysis |
| `POST` | `/api/agent/live-intelligence` | Real-time intelligence for specific regions |
| `POST` | `/api/agent/news-simulation` | Generate news impact simulation |


### Other Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/audit-logs` | Fetch audit logs for a user |
| `GET` | `/api/forecast-scenarios` | Retrieve persisted forecast scenarios |
| `POST` | `/api/suggestions` | AI-generated supply chain suggestions |
| `POST` | `/api/copilotkit` | CopilotKit chat endpoint |
| `POST` | `/api/copilotkit-digital-twin` | Digital twin-specific copilot |

---

## 🔄 Autonomous Agent Lifecycle

```
┌────────────────────────────────────────────────── ────┐
│                   Frontend (Dashboard)                │
│                                                       │
│  ┌────────── ───┐ ┌──────────┐ ┌───────────────────┐  │
│  │ Notification │ │ News Room│ │  Weather Timeline │  │
│  │    Feed      │ │ Timeline │ │   (Segregated)    │  │
│  └──────┬───────┘ └────┬─────┘ └────────┬──────────┘  │
│         │              │                │             │
└─────────┼──────────────┼────────────────┼─────────────┘
          │              │                │
    Every 30s       Every 2min       Every 3hrs
          │              │                │
          ▼              ▼                ▼
┌──────────────┐ ┌──────────────┐ ┌───────────────── ─┐
│  Automated   │ │ News Polling │ │    Weather        │
│  Alerts Agent│ │    Agent     │ │ Intelligence Agent│
│  (Tavily +   │ │ (Tavily raw  │ │ (OpenWeather +    │
│   Gemini AI) │ │  dedup)      │ │  Gemini AI)       │
└──────┬───────┘ └──────┬───────┘ └────────┬──────────┘
       │                │                  │
       ▼                ▼                  ▼
┌────────────────────────────────────────────────┐
│              Supabase PostgreSQL               │
│  notifications │ weather_intelligence │ audit  │
└────────────────────────────────────────────────┘
```

---

## ✅ Roadmap


- [x] Full migration to Google ADK (`@google/adk`)
- [x] Autonomous weather intelligence agent (OpenWeather + AI classification)
- [x] Autonomous threat scanning agent (Tavily + AI correlation)
- [x] News Room with chain-segregated chronological timelines
- [x] Multi-level deduplication engine (URL, node, content)
- [x] Comprehensive audit logging pipeline
- [x] Agent tracing and observability system
- [x] Route optimization agent with graph-based alternate path calculation
- [x] Intelligent rate-limit fallbacks (playbook-based)
- [x] Google Cloud Run deployment pipeline
- [x] CopilotKit natural language integration
- [ ] Predictive demand forecasting using historical Supabase data
- [ ] Multi-model LLM ensemble for risk verification
- [ ] Webhook-based external alert integrations
- [ ] Mobile-responsive progressive web app

---


*Built with ❤️ by the SupplyChain AI Team*
