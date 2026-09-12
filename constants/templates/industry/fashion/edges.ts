import { Edge } from 'reactflow';

// Fashion Seasonal Template Edges
export const FASHION_SEASONAL_TEMPLATE_EDGES: Edge[] = [
  {
    id: 'e-cotton-textile',
    source: 'cotton-supplier-1',
    target: 'textile-mill-1',
    data: {
      mode: 'sea',
      cost: 600,
      transitTime: 7,
      riskMultiplier: 1.5
    }
  },
  {
    id: 'e-textile-garment',
    source: 'textile-mill-1',
    target: 'garment-factory-1',
    data: {
      mode: 'road',
      cost: 200,
      transitTime: 2,
      riskMultiplier: 1.2
    }
  },
  {
    id: 'e-garment-port',
    source: 'garment-factory-1',
    target: 'shipping-port-1',
    data: {
      mode: 'road',
      cost: 100,
      transitTime: 1,
      riskMultiplier: 1.1
    }
  },
  {
    id: 'e-port-warehouse',
    source: 'shipping-port-1',
    target: 'seasonal-warehouse-1',
    data: {
      mode: 'sea',
      cost: 1000,
      transitTime: 14,
      riskMultiplier: 1.4
    }
  },
  {
    id: 'e-warehouse-retail',
    source: 'seasonal-warehouse-1',
    target: 'retail-distribution-2',
    data: {
      mode: 'air',
      cost: 800,
      transitTime: 5,
      riskMultiplier: 1.6
    }
  }
]; 