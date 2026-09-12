import { Edge } from 'reactflow';

// Electronics & High Tech Template Edges
export const ELECTRONICS_TEMPLATE_EDGES: Edge[] = [
  {
    id: 'e-chip-component',
    source: 'chip-supplier-1',
    target: 'component-supplier-1',
    data: {
      mode: 'air',
      cost: 800,
      transitTime: 3,
      riskMultiplier: 1.4
    }
  },
  {
    id: 'e-component-assembly',
    source: 'component-supplier-1',
    target: 'assembly-factory-1',
    data: {
      mode: 'road',
      cost: 300,
      transitTime: 2,
      riskMultiplier: 1.2
    }
  },
  {
    id: 'e-assembly-singapore',
    source: 'assembly-factory-1',
    target: 'asia-port-1',
    data: {
      mode: 'road',
      cost: 400,
      transitTime: 1,
      riskMultiplier: 1.1
    }
  },
  {
    id: 'e-singapore-la',
    source: 'asia-port-1',
    target: 'us-port-1',
    data: {
      mode: 'sea',
      cost: 1200,
      transitTime: 14,
      riskMultiplier: 1.3
    }
  },
  {
    id: 'e-port-warehouse',
    source: 'us-port-1',
    target: 'us-warehouse-1',
    data: {
      mode: 'road',
      cost: 200,
      transitTime: 1,
      riskMultiplier: 1.0
    }
  },
  {
    id: 'e-warehouse-retail',
    source: 'us-warehouse-1',
    target: 'retail-distribution-1',
    data: {
      mode: 'road',
      cost: 150,
      transitTime: 1,
      riskMultiplier: 1.0
    }
  }
]; 