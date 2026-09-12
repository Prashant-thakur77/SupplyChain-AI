import { Edge } from 'reactflow';

// High Value Global Template Edges
export const HIGH_VALUE_GLOBAL_TEMPLATE_EDGES: Edge[] = [
  {
    id: 'e-precision-assembly',
    source: 'precision-supplier-1',
    target: 'assembly-facility-1',
    data: {
      mode: 'air',
      cost: 1200,
      transitTime: 2,
      riskMultiplier: 1.1
    }
  },
  {
    id: 'e-aerospace-assembly',
    source: 'aerospace-supplier-1',
    target: 'assembly-facility-1',
    data: {
      mode: 'air',
      cost: 1500,
      transitTime: 3,
      riskMultiplier: 1.2
    }
  },
  {
    id: 'e-assembly-warehouse',
    source: 'assembly-facility-1',
    target: 'secure-warehouse-1',
    data: {
      mode: 'road',
      cost: 800,
      transitTime: 1,
      riskMultiplier: 1.0
    }
  },
  {
    id: 'e-warehouse-distribution',
    source: 'secure-warehouse-1',
    target: 'express-distribution-1',
    data: {
      mode: 'air',
      cost: 2000,
      transitTime: 4,
      riskMultiplier: 1.3
    }
  },
  {
    id: 'e-distribution-retail',
    source: 'express-distribution-1',
    target: 'premium-retail-1',
    data: {
      mode: 'road',
      cost: 400,
      transitTime: 1,
      riskMultiplier: 1.1
    }
  }
]; 