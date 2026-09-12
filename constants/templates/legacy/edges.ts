import { Edge } from 'reactflow';

// Legacy template edges for backward compatibility
export const INITIAL_EDGES: Edge[] = [
  {
    id: 'e1-2',
    source: 'supplier-1',
    target: 'factory-1',
    data: {
      mode: 'rail',
      cost: 200,
      transitTime: 5,
      riskMultiplier: 1.2
    }
  },
  {
    id: 'e2-3',
    source: 'factory-1',
    target: 'port-1',
    data: {
      mode: 'road',
      cost: 150,
      transitTime: 2,
      riskMultiplier: 1.0
    }
  },
  {
    id: 'e3-4',
    source: 'port-1',
    target: 'warehouse-1',
    data: {
      mode: 'sea',
      cost: 1000,
      transitTime: 20,
      riskMultiplier: 1.5
    }
  },
  {
    id: 'e4-5',
    source: 'warehouse-1',
    target: 'distribution-1',
    data: {
      mode: 'road',
      cost: 500,
      transitTime: 3,
      riskMultiplier: 1.1
    }
  }
]; 