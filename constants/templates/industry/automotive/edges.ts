import { Edge } from 'reactflow';

// Automotive JIT Template Edges
export const AUTOMOTIVE_JIT_TEMPLATE_EDGES: Edge[] = [
  {
    id: 'e-steel-assembly',
    source: 'steel-supplier-1',
    target: 'assembly-plant-1',
    data: {
      mode: 'rail',
      cost: 500,
      transitTime: 2,
      riskMultiplier: 1.1
    }
  },
  {
    id: 'e-parts-staging',
    source: 'parts-supplier-1',
    target: 'staging-warehouse-1',
    data: {
      mode: 'road',
      cost: 200,
      transitTime: 1,
      riskMultiplier: 1.0
    }
  },
  {
    id: 'e-electronics-staging',
    source: 'component-supplier-2',
    target: 'staging-warehouse-1',
    data: {
      mode: 'air',
      cost: 600,
      transitTime: 0.5,
      riskMultiplier: 1.2
    }
  },
  {
    id: 'e-staging-assembly',
    source: 'staging-warehouse-1',
    target: 'assembly-plant-1',
    data: {
      mode: 'road',
      cost: 50,
      transitTime: 0.25,
      riskMultiplier: 1.0
    }
  },
  {
    id: 'e-assembly-dealership',
    source: 'assembly-plant-1',
    target: 'dealership-distribution-1',
    data: {
      mode: 'road',
      cost: 300,
      transitTime: 2,
      riskMultiplier: 1.1
    }
  }
]; 