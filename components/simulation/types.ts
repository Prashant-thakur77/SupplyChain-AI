// Define the supply chain interface based on the new API response
export interface SupplyChainData {
  supply_chain_id: string;
  name: string;
  description: string;
  user_id: string;
  organisation: {
    id: string;
    name: string;
    industry: string;
    location: string;
    description: string;
    sub_industry: string;
  };
  form_data: {
    risks: string[];
    country: string | null;
    currency: string;
    industry: string;
    supplierTiers: string;
    customIndustry: string | null;
    shippingMethods: string[];
    annualVolumeType: string;
    annualVolumeValue: number;
    operationsLocation: string[];
    productCharacteristics: string[];
  };
  timestamp: string;
  nodes: any[];
  edges: any[];
}

export interface ApiResponse {
  status: string;
  data: SupplyChainData[];
  meta: {
    total_supply_chains: number;
    total_nodes: number;
    total_edges: number;
  };
} 