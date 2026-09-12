import { Edge } from 'reactflow';

// Energy Bulk Template Edges
export const ENERGY_BULK_TEMPLATE_EDGES: Edge[] = [
  {
    id: 'e-mining-rail',
    source: 'mining-operation-1',
    target: 'rail-terminal-1',
    data: {
      mode: 'road',
      cost: 300,
      transitTime: 1,
      riskMultiplier: 1.2
    }
  },
  {
    id: 'e-rail-power',
    source: 'rail-terminal-1',
    target: 'power-plant-1',
    data: {
      mode: 'rail',
      cost: 800,
      transitTime: 2,
      riskMultiplier: 1.3
    }
  },
  {
    id: 'e-power-grid',
    source: 'power-plant-1',
    target: 'grid-distribution-1',
    data: {
      mode: 'electrical',
      cost: 0,
      transitTime: 0,
      riskMultiplier: 1.4
    }
  }
]; 