import { Edge } from 'reactflow';

// Tier 3+ Complex Template Edges
export const TIER3_COMPLEX_TEMPLATE_EDGES: Edge[] = [
  {
    id: 'e-tier3-tier2',
    source: 'tier3-raw-material-1',
    target: 'tier2-component-1',
    data: {
      mode: 'sea',
      cost: 1500,
      transitTime: 21,
      riskMultiplier: 1.5
    }
  },
  {
    id: 'e-tier2-tier1',
    source: 'tier2-component-1',
    target: 'tier1-subassembly-1',
    data: {
      mode: 'air',
      cost: 1200,
      transitTime: 3,
      riskMultiplier: 1.3
    }
  },
  {
    id: 'e-tier1-oem',
    source: 'tier1-subassembly-1',
    target: 'oem-assembly-1',
    data: {
      mode: 'sea',
      cost: 800,
      transitTime: 14,
      riskMultiplier: 1.2
    }
  },
  {
    id: 'e-oem-global-hub',
    source: 'oem-assembly-1',
    target: 'global-distribution-hub-1',
    data: {
      mode: 'air',
      cost: 600,
      transitTime: 5,
      riskMultiplier: 1.1
    }
  },
  {
    id: 'e-global-regional',
    source: 'global-distribution-hub-1',
    target: 'regional-distribution-1',
    data: {
      mode: 'air',
      cost: 1000,
      transitTime: 3,
      riskMultiplier: 1.2
    }
  },
  {
    id: 'e-regional-retail',
    source: 'regional-distribution-1',
    target: 'multi-channel-retail-1',
    data: {
      mode: 'road',
      cost: 400,
      transitTime: 2,
      riskMultiplier: 1.1
    }
  }
]; 