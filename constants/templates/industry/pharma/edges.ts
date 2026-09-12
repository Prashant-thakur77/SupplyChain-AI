import { Edge } from 'reactflow';

// Pharma Regulated Template Edges
export const PHARMA_REGULATED_TEMPLATE_EDGES: Edge[] = [
  {
    id: 'e-api-manufacturing',
    source: 'api-supplier-1',
    target: 'manufacturing-plant-1',
    data: {
      mode: 'air',
      cost: 2000,
      transitTime: 2,
      riskMultiplier: 1.6
    }
  },
  {
    id: 'e-excipient-manufacturing',
    source: 'excipient-supplier-1',
    target: 'manufacturing-plant-1',
    data: {
      mode: 'road',
      cost: 400,
      transitTime: 2,
      riskMultiplier: 1.3
    }
  },
  {
    id: 'e-manufacturing-storage',
    source: 'manufacturing-plant-1',
    target: 'cold-storage-1',
    data: {
      mode: 'road',
      cost: 150,
      transitTime: 1,
      riskMultiplier: 1.2
    }
  },
  {
    id: 'e-storage-distribution',
    source: 'cold-storage-1',
    target: 'regional-distribution-1',
    data: {
      mode: 'air',
      cost: 500,
      transitTime: 1,
      riskMultiplier: 1.3
    }
  },
  {
    id: 'e-distribution-pharmacy',
    source: 'regional-distribution-1',
    target: 'pharmacy-retail-1',
    data: {
      mode: 'road',
      cost: 200,
      transitTime: 2,
      riskMultiplier: 1.1
    }
  }
]; 