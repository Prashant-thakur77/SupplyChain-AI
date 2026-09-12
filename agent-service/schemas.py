"""Pydantic models shared by agents (structured output), the HTTP API, and mirrored in types/agent.ts."""
from __future__ import annotations

from enum import Enum
from typing import Any, Literal, Optional

from pydantic import BaseModel, Field, model_validator


class Severity(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class TwinNode(BaseModel):
    id: str
    label: str
    type: str = "warehouse"
    lat: Optional[float] = None
    lng: Optional[float] = None
    country: Optional[str] = None
    capacity: float = 0
    risk_level: float = 0
    data: dict[str, Any] = Field(default_factory=dict)


class TwinEdge(BaseModel):
    id: str
    source: str
    target: str
    mode: str = "road"
    cost: float = 0
    transit_days: float = 0
    risk_multiplier: float = 1.0
    capacity: Optional[float] = None


class Twin(BaseModel):
    supply_chain_id: str
    name: str = ""
    nodes: list[TwinNode]
    edges: list[TwinEdge]


class Source(BaseModel):
    title: str
    url: str
    published_at: Optional[str] = None
    credibility: float = 0.5


class Event(BaseModel):
    """A candidate disruption found by Sentinel or injected manually."""

    id: str
    kind: Literal["news", "weather", "manual", "simulation"]
    title: str
    description: str
    location: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    occurred_at: Optional[str] = None
    sources: list[Source] = Field(default_factory=list)
    failed_node_ids: list[str] = Field(default_factory=list)
    failed_edge_ids: list[str] = Field(default_factory=list)


class Assessment(BaseModel):
    event_id: str
    title: str
    summary: str
    severity: Severity
    confidence: float = Field(ge=0, le=1)
    failed_node_ids: list[str] = Field(default_factory=list, description="Nodes that are actually down / unusable")
    failed_edge_ids: list[str] = Field(default_factory=list, description="Lanes that are actually cut")
    affected_node_ids: list[str] = Field(default_factory=list, description="Downstream nodes whose flow is impacted")
    affected_edge_ids: list[str] = Field(default_factory=list)
    sources: list[Source]
    needs_review: bool
    category: Literal["GEOPOLITICAL", "WEATHER", "LOGISTICS", "SUPPLIER", "MARKET", "OTHER"] = "OTHER"


class RouteCandidate(BaseModel):
    id: str
    origin: str
    destination: str
    path: list[str]
    labels: list[str]
    modes: list[str]
    cost: float
    transit_days: float
    max_risk: float
    baseline_cost: float
    baseline_days: float
    added_cost: float
    added_days: float
    feasible: bool = True


class RouteRanking(BaseModel):
    ranked_candidate_ids: list[str]
    recommended_candidate_id: Optional[str]
    rationale: str
    tradeoffs: list[str]
    wait_is_viable: bool
    wait_rationale: str


class ImpactEstimate(BaseModel):
    revenue_at_risk_usd: float
    delay_days: float
    nodes_affected: int
    orders_affected_pct: float = Field(ge=0, le=100)
    summary: str
    assumptions: list[str]


class MitigationStep(BaseModel):
    title: str
    owner: str
    due_in_days: int
    detail: str


class MitigationPlan(BaseModel):
    title: str
    summary: str
    steps: list[MitigationStep]
    estimated_cost_usd: float
    risk_after: Severity


class DecisionOption(BaseModel):
    id: str
    label: str
    kind: Literal["reroute", "wait", "mitigate", "escalate"]
    added_cost: float = 0
    added_days: float = 0
    risk: Severity = Severity.LOW
    route_candidate_id: Optional[str] = None
    detail: str = ""


class Decision(BaseModel):
    supply_chain_id: str
    event_id: Optional[str] = None
    title: str
    summary: str
    options: list[DecisionOption]
    recommended_option_id: str
    rationale: str
    confidence: float = 0.7
    sources: list[Source] = Field(default_factory=list)
    trace_id: Optional[str] = None

    @model_validator(mode="after")
    def _recommended_exists(self):
        if self.recommended_option_id not in {o.id for o in self.options}:
            raise ValueError("recommended_option_id must reference an option")
        return self


class Forecast(BaseModel):
    horizon: Literal["7d", "30d", "90d"]
    risk_score: float = Field(ge=0, le=100)
    trend: Literal["improving", "stable", "worsening"]
    drivers: list[str]
    summary: str


class Scenario(BaseModel):
    id: str
    title: str
    description: str
    disruption_type: Literal["weather", "geopolitical", "economic", "operational"]
    failed_node_ids: list[str]
    probability: float = Field(ge=0, le=1)
    duration_days: int


class ScenarioSet(BaseModel):
    scenarios: list[Scenario]


class GraphEvent(BaseModel):
    """Streamed to the UI while a graph executes."""

    type: Literal["node_start", "node_end", "tool", "result", "error"]
    node: Optional[str] = None
    elapsed_ms: Optional[int] = None
    payload: Optional[dict[str, Any]] = None


# ---- Report shapes consumed by the existing web UI (camelCase on purpose — they are the UI's contract) ----------------
class CostBreakdown(BaseModel):
    category: str
    amount: str
    percentage: float


class FinancialImpact(BaseModel):
    totalCostImpact: str
    costBreakdown: list[CostBreakdown]


class OperationalImpact(BaseModel):
    averageDelay: str
    inventoryReduction: str
    recoveryTime: str
    affectedNodes: int


class SimMitigation(BaseModel):
    title: str
    estimatedCost: str
    timeToImplement: str
    riskReduction: str
    feasibility: Literal["HIGH", "MEDIUM", "LOW"]


class CascadingEffect(BaseModel):
    affectedNode: str
    impactType: str
    severity: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    timeline: str
    propagationPath: list[str]
    probability: float = Field(ge=0, le=1)
    financialImpact: str
    mitigationComplexity: Literal["LOW", "MEDIUM", "HIGH"]


class NetworkAnalysis(BaseModel):
    totalNodes: int
    totalEdges: int
    networkDensity: float
    criticalNodes: list[str]
    singlePointsOfFailure: list[str]
    alternativeRoutes: int
    averageShortestPath: float


class SimulationReport(BaseModel):
    executiveSummary: str
    keyFindings: list[str]
    financialImpact: FinancialImpact
    operationalImpact: OperationalImpact
    criticalPath: str
    riskFactors: list[str]
    mitigationStrategies: list[SimMitigation]
    cascadingEffects: list[CascadingEffect]
    networkAnalysis: NetworkAnalysis
    confidenceScore: float = Field(ge=0, le=1)
    analysisDepth: Literal["BASIC", "INTERMEDIATE", "ADVANCED", "EXPERT"] = "ADVANCED"


class ResourceRequirements(BaseModel):
    personnel: int
    equipment: list[str]
    partnerships: list[str]


class StrategyItem(BaseModel):
    id: int
    title: str
    description: str
    priority: Literal["Critical", "High", "Medium", "Low", "Strategic"]
    timeframe: str
    costEstimate: str
    impactReduction: str
    status: Literal["ready", "planning", "recommended", "in-progress", "completed"] = "recommended"
    category: Literal["immediate", "shortTerm", "longTerm"]
    feasibility: Literal["HIGH", "MEDIUM", "LOW"]
    dependencies: list[str]
    riskFactors: list[str]
    successMetrics: list[str]
    resourceRequirements: ResourceRequirements


class RiskMitigationMetrics(BaseModel):
    currentRisk: float
    targetRisk: float
    costToImplement: str
    expectedROI: str
    paybackPeriod: str
    riskReduction: str


class StrategyReport(BaseModel):
    immediate: list[StrategyItem]
    shortTerm: list[StrategyItem]
    longTerm: list[StrategyItem]
    riskMitigationMetrics: RiskMitigationMetrics
    keyInsights: list[str]
    marketIntelligence: list[str]
    bestPractices: list[str]
    contingencyPlans: list[str]


class ForecastScenario(BaseModel):
    scenarioName: str
    scenarioType: Literal["disruption", "natural", "economic", "political", "operational"]
    description: str
    disruptionSeverity: int = Field(ge=10, le=95)
    disruptionDuration: int = Field(ge=3, le=90)
    affectedNode: str
    monteCarloRuns: int = 1000
    distributionType: Literal["normal", "log-normal", "uniform"] = "normal"
    failureThreshold: float = Field(ge=10, le=80)
    bufferPercent: float = Field(ge=5, le=30)
    probability: float = Field(ge=0, le=1, default=0.3)


class ForecastReport(BaseModel):
    scenarios: list[ForecastScenario] = Field(min_length=2, max_length=4)
    overallRiskScore: float = Field(ge=0, le=100)
    confidenceScore: float = Field(ge=0, le=1)
    forecastSummary: str


class NodeRisk(BaseModel):
    nodeId: str
    riskScore: float = Field(ge=0.1, le=0.99)
    reason: str


class LiveIntelReport(BaseModel):
    disruptionsFound: bool
    nodeRisks: list[NodeRisk]
    description: str
    sources: list[Source] = Field(default_factory=list)


class Suggestion(BaseModel):
    id: str
    title: str = Field(max_length=60)
    description: str
    action: str
    confidence: float = Field(ge=0, le=100)
    category: Literal["optimization", "risk", "efficiency", "cost", "planning"]


class SuggestionList(BaseModel):
    suggestions: list[Suggestion]
