import { Edge } from 'reactflow';

// Food & Beverage Cold Chain Template Edges
export const FOOD_BEVERAGE_COLD_CHAIN_TEMPLATE_EDGES: Edge[] = [
  {
    id: 'e-farm-processing',
    source: 'farm-supplier-1',
    target: 'processing-facility-1',
    data: {
      mode: 'road',
      cost: 100,
      transitTime: 0.5,
      riskMultiplier: 1.3
    }
  },
  {
    id: 'e-processing-warehouse',
    source: 'processing-facility-1',
    target: 'cold-warehouse-1',
    data: {
      mode: 'road',
      cost: 80,
      transitTime: 1,
      riskMultiplier: 1.2
    }
  },
  {
    id: 'e-warehouse-distribution',
    source: 'cold-warehouse-1',
    target: 'regional-distribution-1',
    data: {
      mode: 'road',
      cost: 60,
      transitTime: 0.5,
      riskMultiplier: 1.4
    }
  }
]; 