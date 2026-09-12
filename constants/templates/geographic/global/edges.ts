import { Edge } from 'reactflow';

// Global Network Template Edges
export const GLOBAL_NETWORK_TEMPLATE_EDGES: Edge[] = [
  {
    id: 'e-asia-supplier-assembly',
    source: 'asia-supplier-1',
    target: 'global-assembly-1',
    data: {
      mode: 'sea',
      cost: 600,
      transitTime: 14,
      riskMultiplier: 1.2
    }
  },
  {
    id: 'e-europe-supplier-assembly',
    source: 'europe-supplier-1',
    target: 'global-assembly-1',
    data: {
      mode: 'air',
      cost: 1200,
      transitTime: 3,
      riskMultiplier: 1.3
    }
  },
  {
    id: 'e-assembly-americas',
    source: 'global-assembly-1',
    target: 'americas-warehouse-1',
    data: {
      mode: 'air',
      cost: 2000,
      transitTime: 12,
      riskMultiplier: 1.4
    }
  },
  {
    id: 'e-assembly-europe',
    source: 'global-assembly-1',
    target: 'europe-warehouse-1',
    data: {
      mode: 'air',
      cost: 1500,
      transitTime: 8,
      riskMultiplier: 1.2
    }
  },
  {
    id: 'e-americas-distribution',
    source: 'americas-warehouse-1',
    target: 'global-distribution-1',
    data: {
      mode: 'air',
      cost: 800,
      transitTime: 6,
      riskMultiplier: 1.1
    }
  },
  {
    id: 'e-europe-distribution',
    source: 'europe-warehouse-1',
    target: 'global-distribution-1',
    data: {
      mode: 'road',
      cost: 400,
      transitTime: 2,
      riskMultiplier: 1.0
    }
  },
  {
    id: 'e-distribution-retail',
    source: 'global-distribution-1',
    target: 'multi-market-retail-1',
    data: {
      mode: 'air',
      cost: 1800,
      transitTime: 10,
      riskMultiplier: 1.3
    }
  }
]; 