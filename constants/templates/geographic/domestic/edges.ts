import { Edge } from 'reactflow';

// Domestic Regional Template Edges
export const DOMESTIC_REGIONAL_TEMPLATE_EDGES: Edge[] = [
  {
    id: 'e-regional-manufacturing',
    source: 'regional-supplier-1',
    target: 'central-manufacturing-1',
    data: {
      mode: 'road',
      cost: 250,
      transitTime: 1,
      riskMultiplier: 1.0
    }
  },
  {
    id: 'e-manufacturing-dc',
    source: 'central-manufacturing-1',
    target: 'regional-dc-1',
    data: {
      mode: 'road',
      cost: 180,
      transitTime: 2,
      riskMultiplier: 1.1
    }
  },
  {
    id: 'e-dc-local',
    source: 'regional-dc-1',
    target: 'local-distribution-1',
    data: {
      mode: 'road',
      cost: 120,
      transitTime: 1,
      riskMultiplier: 1.0
    }
  }
]; 