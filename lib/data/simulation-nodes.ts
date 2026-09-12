/**
 * Supply Chain Node Data Configuration
 * Contains node data for simulation results and testing
 */

export interface SupplyChainNode {
  id: string;
  name: string;
  type: string;
  status: string;
  statusDetail: string;
  downtime: string;
  outputDrop: string;
  recovery: string;
  riskScore: number;
}

export const DEFAULT_SIMULATION_NODES: SupplyChainNode[] = [
  {
    id: "SH-PORT-001",
    name: "Shanghai Port Terminal A",
    type: "port",
    status: "failed",
    statusDetail: "Complete shutdown due to typhoon",
    downtime: "72 hours",
    outputDrop: "100%",
    recovery: "14 days",
    riskScore: 95
  },
  {
    id: "WH-SHA-002",
    name: "Shanghai Warehouse Complex",
    type: "warehouse",
    status: "disrupted", 
    statusDetail: "Limited operations, 30% capacity",
    downtime: "24 hours",
    outputDrop: "70%",
    recovery: "7 days",
    riskScore: 78
  },
  {
    id: "DC-HK-003",
    name: "Hong Kong Distribution Center",
    type: "distribution",
    status: "partial",
    statusDetail: "Overflow handling, reduced efficiency",
    downtime: "0 hours",
    outputDrop: "25%",
    recovery: "3 days",
    riskScore: 45
  },
  {
    id: "MF-GZ-004",
    name: "Guangzhou Electronics Factory",
    type: "manufacturing",
    status: "partial",
    statusDetail: "Raw material shortage",
    downtime: "12 hours",
    outputDrop: "45%",
    recovery: "10 days",
    riskScore: 62
  },
  {
    id: "SP-BJ-005",
    name: "Beijing Auto Parts Supplier",
    type: "supplier",
    status: "operational",
    statusDetail: "Normal operations maintained",
    downtime: "0 hours",
    outputDrop: "5%",
    recovery: "1 day",
    riskScore: 22
  },
  {
    id: "WH-SZ-006",
    name: "Shenzhen Tech Warehouse",
    type: "warehouse",
    status: "disrupted",
    statusDetail: "Rerouting delays",
    downtime: "18 hours",
    outputDrop: "55%",
    recovery: "8 days",
    riskScore: 71
  },
  {
    id: "DC-TJ-007",
    name: "Tianjin Distribution Hub",
    type: "distribution",
    status: "operational",
    statusDetail: "Increased throughput to compensate",
    downtime: "0 hours",
    outputDrop: "0%",
    recovery: "0 days",
    riskScore: 18
  },
  {
    id: "MF-CD-008",
    name: "Chengdu Manufacturing Plant",
    type: "manufacturing",
    status: "partial",
    statusDetail: "Supply chain delays",
    downtime: "8 hours",
    outputDrop: "35%",
    recovery: "6 days",
    riskScore: 52
  }
];

/**
 * Status configuration for consistency across the application
 */
export const NODE_STATUS_CONFIG = {
  operational: {
    label: "Operational",
    className: "bg-green-500"
  },
  partial: {
    label: "Partial",
    className: "bg-yellow-500"
  },
  disrupted: {
    label: "Disrupted",
    className: "bg-orange-500"
  },
  failed: {
    label: "Failed",
    className: "bg-red-500"
  }
} as const;

export type NodeStatus = keyof typeof NODE_STATUS_CONFIG;
