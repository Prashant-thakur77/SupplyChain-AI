// Supply Chain Node Types
export type NodeType = "supplier" | "manufacturing" | "logistics" | "distribution" | "storage" | "retail";

// Supply Chain Node Statuses
export type NodeStatus = "operational" | "partial" | "disrupted" | "failed";

// Node interface - combines data from cascading-failure-map and node-impact-grid
export interface SupplyChainNode {
  id: string;
  name: string;
  type: NodeType;
  status: NodeStatus;
  // Position data for visualization
  x: number;
  y: number;
  // Impact details
  statusDetail: string;
  downtime: string;
  outputDrop: string;
  recovery: string;
  riskScore: number;
  // Daily metrics for each node
  dailyMetrics?: {
    day: number;
    output: number;
    inventory: number;
  }[];
}

// Link interface for connections between nodes
export interface SupplyChainLink {
  source: string;
  target: string;
  value: number;
}

// Scenario information
export interface SupplyChainScenario {
  id: string;
  name: string;
  type: string;
  description: string;
  supplyChain: string;
  affectedNode: string;
  duration: string;
  severity: string;
  monteCarloRuns: number;
  cascadingThreshold: string;
  inventoryBuffer: string;
  lastUpdated: string;
}

// Combined data structure for all supply chain impact data
export interface SupplyChainImpactData {
  scenario: SupplyChainScenario;
  nodes: SupplyChainNode[];
  links: SupplyChainLink[];
  productionData: {
    day: number;
    actual: number | null;
    projected: number;
  }[];
  inventoryData: {
    day: number;
    level: number;
  }[];
}

// Node status summary data for pie chart
export interface NodeStatusSummary {
  name: string;
  value: number;
}

// Helper functions to derive data
export const getNodeStatusData = (data: SupplyChainImpactData): NodeStatusSummary[] => {
  const counts = {
    operational: 0,
    partial: 0,
    disrupted: 0,
    failed: 0,
  };
  
  data.nodes.forEach(node => {
    counts[node.status]++;
  });
  
  return [
    { name: "Operational", value: counts.operational },
    { name: "Partial", value: counts.partial },
    { name: "Disrupted", value: counts.disrupted },
    { name: "Failed", value: counts.failed },
  ].filter(item => item.value > 0);
};

export const getImpactByNodeData = (data: SupplyChainImpactData) => {
  return data.nodes
    .map(node => ({
      name: node.name,
      impact: parseInt(node.outputDrop.replace("%", "").replace("-", "")),
    }))
    .filter(node => node.impact > 0)
    .sort((a, b) => b.impact - a.impact)
    .slice(0, 5);
};

// Unified dummy data
export const supplyChainImpactData: SupplyChainImpactData = {
  scenario: {
    id: "scenario-001",
    name: "Port Strike Scenario",
    type: "Natural Disaster",
    description: "Supply chain disruption analysis",
    supplyChain: "fish_chain",
    affectedNode: "Supplier A",
    duration: "14 days",
    severity: "70%",
    monteCarloRuns: 100,
    cascadingThreshold: "30%",
    inventoryBuffer: "20%",
    lastUpdated: "Today, 10:30 AM",
  },
  nodes: [
    {
      id: "1",
      name: "Supplier A",
      type: "supplier",
      status: "disrupted",
      statusDetail: "Primary disruption",
      downtime: "14 days",
      outputDrop: "-70%",
      recovery: "Day 15",
      riskScore: 85,
      x: 100,
      y: 100,
      dailyMetrics: [
        { day: 1, output: 100, inventory: 100 },
        { day: 2, output: 95, inventory: 95 },
        { day: 3, output: 85, inventory: 85 },
        { day: 4, output: 70, inventory: 70 },
        { day: 5, output: 50, inventory: 50 },
      ]
    },
    {
      id: "2",
      name: "Factory B",
      type: "manufacturing",
      status: "failed",
      statusDetail: "Failed (Day 5)",
      downtime: "9 days",
      outputDrop: "-60%",
      recovery: "Day 14",
      riskScore: 78,
      x: 250,
      y: 150,
    },
    {
      id: "3",
      name: "Port C",
      type: "logistics",
      status: "partial",
      statusDetail: "Limited capacity",
      downtime: "—",
      outputDrop: "-30%",
      recovery: "Ongoing",
      riskScore: 65,
      x: 400,
      y: 100,
    },
    {
      id: "4",
      name: "Distributor D",
      type: "distribution",
      status: "partial",
      statusDetail: "Reduced throughput",
      downtime: "—",
      outputDrop: "-25%",
      recovery: "Day 18",
      riskScore: 55,
      x: 550,
      y: 150,
    },
    {
      id: "5",
      name: "Warehouse E",
      type: "storage",
      status: "operational",
      statusDetail: "Using buffer inventory",
      downtime: "—",
      outputDrop: "-15%",
      recovery: "Day 20",
      riskScore: 40,
      x: 700,
      y: 100,
    },
    {
      id: "6",
      name: "Retailer F",
      type: "retail",
      status: "operational",
      statusDetail: "Stock limitations",
      downtime: "—",
      outputDrop: "-10%",
      recovery: "Day 21",
      riskScore: 35,
      x: 850,
      y: 150,
    },
    {
      id: "7",
      name: "Supplier G",
      type: "supplier",
      status: "operational",
      statusDetail: "Unaffected",
      downtime: "—",
      outputDrop: "0%",
      recovery: "—",
      riskScore: 10,
      x: 100,
      y: 250,
    },
    {
      id: "8",
      name: "Factory H",
      type: "manufacturing",
      status: "operational",
      statusDetail: "Unaffected",
      downtime: "—",
      outputDrop: "0%",
      recovery: "—",
      riskScore: 5,
      x: 250,
      y: 300,
    },
    {
      id: "9",
      name: "Warehouse I",
      type: "storage",
      status: "operational",
      statusDetail: "Unaffected",
      downtime: "—",
      outputDrop: "0%",
      recovery: "—",
      riskScore: 5,
      x: 400,
      y: 250,
    },
    {
      id: "10",
      name: "Retailer J",
      type: "retail",
      status: "operational",
      statusDetail: "Unaffected",
      downtime: "—",
      outputDrop: "0%",
      recovery: "—",
      riskScore: 5,
      x: 550,
      y: 300,
    },
    {
      id: "11",
      name: "Supplier K",
      type: "supplier",
      status: "operational",
      statusDetail: "Unaffected",
      downtime: "—",
      outputDrop: "0%",
      recovery: "—",
      riskScore: 5,
      x: 700,
      y: 250,
    },
  ],
  links: [
    { source: "1", target: "2", value: 5 },
    { source: "2", target: "3", value: 5 },
    { source: "3", target: "4", value: 5 },
    { source: "4", target: "5", value: 5 },
    { source: "5", target: "6", value: 5 },
    { source: "7", target: "8", value: 5 },
    { source: "8", target: "9", value: 5 },
    { source: "9", target: "10", value: 5 },
    { source: "7", target: "2", value: 3 },
    { source: "11", target: "5", value: 3 },
  ],
  productionData: [
    { day: 1, actual: 100, projected: 100 },
    { day: 2, actual: 100, projected: 100 },
    { day: 3, actual: 95, projected: 95 },
    { day: 4, actual: 80, projected: 80 },
    { day: 5, actual: 60, projected: 60 },
    { day: 6, actual: 40, projected: 40 },
    { day: 7, actual: 30, projected: 30 },
    { day: 8, actual: 30, projected: 30 },
    { day: 9, actual: 30, projected: 30 },
    { day: 10, actual: 30, projected: 30 },
    { day: 11, actual: 30, projected: 30 },
    { day: 12, actual: 30, projected: 30 },
    { day: 13, actual: 30, projected: 30 },
    { day: 14, actual: 30, projected: 30 },
    { day: 15, actual: 40, projected: 40 },
    { day: 16, actual: 50, projected: 50 },
    { day: 17, actual: 60, projected: 60 },
    { day: 18, actual: 70, projected: 70 },
    { day: 19, actual: 80, projected: 80 },
    { day: 20, actual: 90, projected: 90 },
    { day: 21, actual: 95, projected: 95 },
    { day: 22, actual: null, projected: 100 },
    { day: 23, actual: null, projected: 100 },
    { day: 24, actual: null, projected: 100 },
    { day: 25, actual: null, projected: 100 },
    { day: 26, actual: null, projected: 100 },
    { day: 27, actual: null, projected: 100 },
    { day: 28, actual: null, projected: 100 },
    { day: 29, actual: null, projected: 100 },
    { day: 30, actual: null, projected: 100 },
  ],
  inventoryData: [
    { day: 1, level: 100 },
    { day: 2, level: 95 },
    { day: 3, level: 85 },
    { day: 4, level: 70 },
    { day: 5, level: 50 },
    { day: 6, level: 30 },
    { day: 7, level: 20 },
    { day: 8, level: 10 },
    { day: 9, level: 5 },
    { day: 10, level: 0 },
    { day: 11, level: 0 },
    { day: 12, level: 0 },
    { day: 13, level: 0 },
    { day: 14, level: 0 },
    { day: 15, level: 10 },
    { day: 16, level: 20 },
    { day: 17, level: 30 },
    { day: 18, level: 40 },
    { day: 19, level: 50 },
    { day: 20, level: 60 },
    { day: 21, level: 70 },
    { day: 22, level: 80 },
    { day: 23, level: 90 },
    { day: 24, level: 95 },
    { day: 25, level: 100 },
    { day: 26, level: 100 },
    { day: 27, level: 100 },
    { day: 28, level: 100 },
    { day: 29, level: 100 },
    { day: 30, level: 100 },
  ],
};

// Export constant values used in charts
export const NODE_STATUS_COLORS = ["#22c55e", "#eab308", "#ef4444", "#f97316"];