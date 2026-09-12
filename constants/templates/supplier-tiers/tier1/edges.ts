import { Edge } from 'reactflow';

// Tier 1 Simple Template Edges
export const TIER1_SIMPLE_TEMPLATE_EDGES: Edge[] = [
  {
    id: 'e-supplier-manufacturing',
    source: 'tier1-supplier-1',
    target: 'main-manufacturing-1',
    data: {
      mode: 'road',
      cost: 300,
      transitTime: 1,
      riskMultiplier: 1.0
    }
  },
  {
    id: 'e-manufacturing-warehouse',
    source: 'main-manufacturing-1',
    target: 'central-warehouse-1',
    data: {
      mode: 'road',
      cost: 200,
      transitTime: 1,
      riskMultiplier: 1.1
    }
  },
  {
    id: 'e-warehouse-distribution',
    source: 'central-warehouse-1',
    target: 'direct-distribution-1',
    data: {
      mode: 'road',
      cost: 150,
      transitTime: 1,
      riskMultiplier: 1.0
    }
  },
  {
    id: 'e-distribution-customer',
    source: 'direct-distribution-1',
    target: 'end-customer-1',
    data: {
      mode: 'road',
      cost: 100,
      transitTime: 1,
      riskMultiplier: 1.0
    }
  }
]; 