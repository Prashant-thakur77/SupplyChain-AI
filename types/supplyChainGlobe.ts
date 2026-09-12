export type NodeType = "supplier" | "manufacturer" | "warehouse" | "retailer" | "port";

export type NodeStatus = "active" | "delayed" | "critical" | "inactive";

export interface SupplyNode {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: NodeType;
  status: NodeStatus;
  country: string;
  city: string;
}

export interface SupplyArc {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  label?: string;
  status: NodeStatus;
}
