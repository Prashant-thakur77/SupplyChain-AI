import { Edge } from 'reactflow';

// Hazardous Materials Template Edges
export const HAZARDOUS_MATERIALS_TEMPLATE_EDGES: Edge[] = [
  {
    id: 'e-chemical-processing',
    source: 'chemical-supplier-1',
    target: 'hazmat-processing-1',
    data: {
      mode: 'road',
      cost: 800,
      transitTime: 1,
      riskMultiplier: 1.8
    }
  },
  {
    id: 'e-processing-storage',
    source: 'hazmat-processing-1',
    target: 'secure-hazmat-storage-1',
    data: {
      mode: 'road',
      cost: 400,
      transitTime: 2,
      riskMultiplier: 1.6
    }
  },
  {
    id: 'e-storage-distribution',
    source: 'secure-hazmat-storage-1',
    target: 'hazmat-distribution-1',
    data: {
      mode: 'road',
      cost: 600,
      transitTime: 3,
      riskMultiplier: 1.7
    }
  },
  {
    id: 'e-distribution-customer',
    source: 'hazmat-distribution-1',
    target: 'industrial-customer-1',
    data: {
      mode: 'road',
      cost: 350,
      transitTime: 1,
      riskMultiplier: 1.5
    }
  }
]; 