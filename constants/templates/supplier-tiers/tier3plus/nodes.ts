import { Node } from 'reactflow';

// Use when: supplierTiers = "tier3plus" (complex multi-tier supply chain)
// Characteristics: Deep supplier networks, Multi-tier complexity, Global sourcing
// Typical risks: Supply chain complexity, Visibility gaps, Cascading failures
export const TIER3_COMPLEX_TEMPLATE: Node[] = [
  {
    id: 'tier3-raw-material-1',
    type: 'supplierNode',
    data: {
      label: 'Tier 3 Raw Materials',
      description: 'Raw material extraction and processing',
      type: 'Supplier',
      capacity: 100000,
      leadTime: 45,
      riskScore: 0.6,
      location: { lat: -23.550, lng: -46.633, country: 'BRA' },
      address: 'São Paulo Raw Materials, Brazil',
      country: 'BRA',
      // Supplier-specific required fields
      supplierTier: 'tier3+',
      supplyCapacity: 100000,
      materialType: 'Raw Materials',
      reliabilityPct: 78
    },
    position: { x: 100, y: 80 },
  },
  {
    id: 'tier2-component-1',
    type: 'supplierNode',
    data: {
      label: 'Tier 2 Components',
      description: 'Component manufacturing and assembly',
      type: 'Supplier',
      capacity: 60000,
      leadTime: 30,
      riskScore: 0.4,
      location: { lat: 19.076, lng: 72.877, country: 'IND' },
      address: 'Mumbai Component Manufacturing, India',
      country: 'IND',
      // Supplier-specific required fields
      supplierTier: 'tier2',
      supplyCapacity: 60000,
      materialType: 'Component Parts',
      reliabilityPct: 85
    },
    position: { x: 300, y: 150 },
  },
  {
    id: 'tier1-subassembly-1',
    type: 'supplierNode',
    data: {
      label: 'Tier 1 Subassembly',
      description: 'Subassembly and integration',
      type: 'Supplier',
      capacity: 40000,
      leadTime: 21,
      riskScore: 0.3,
      location: { lat: 22.543, lng: 114.057, country: 'CHN' },
      address: 'Shenzhen Subassembly, China',
      country: 'CHN',
      // Supplier-specific required fields
      supplierTier: 'tier1',
      supplyCapacity: 40000,
      materialType: 'Subassemblies',
      reliabilityPct: 89
    },
    position: { x: 500, y: 120 },
  },
  {
    id: 'oem-assembly-1',
    type: 'factoryNode',
    data: {
      label: 'OEM Assembly',
      description: 'Original equipment manufacturer final assembly',
      type: 'Factory',
      capacity: 30000,
      leadTime: 14,
      riskScore: 0.2,
      location: { lat: 48.858, lng: 2.294, country: 'FRA' },
      address: 'Paris OEM Assembly, France',
      country: 'FRA',
      // Factory-specific required fields
      cycleTime: 6, // days per unit
      utilizationPct: 83
    },
    position: { x: 700, y: 180 },
  },
  {
    id: 'global-distribution-hub-1',
    type: 'warehouseNode',
    data: {
      label: 'Global Distribution Hub',
      description: 'Multi-regional distribution center',
      type: 'Warehouse',
      capacity: 50000,
      leadTime: 7,
      riskScore: 0.3,
      location: { lat: 52.373, lng: 4.890, country: 'NLD' },
      address: 'Amsterdam Global Hub, Netherlands',
      country: 'NLD',
      // Warehouse-specific required fields
      storageCapacity: 50000,
      temperatureControl: true,
      storageCostPerUnit: 6.0,
      handlingCostPerUnit: 3.5
    },
    position: { x: 950, y: 120 },
  },
  {
    id: 'regional-distribution-1',
    type: 'distributionNode',
    data: {
      label: 'Regional Distribution',
      description: 'Multi-tier regional distribution network',
      type: 'Distribution',
      capacity: 35000,
      leadTime: 5,
      riskScore: 0.3,
      location: { lat: 40.712, lng: -74.006, country: 'USA' },
      address: 'New York Regional Distribution, NY',
      country: 'USA',
      // Distribution-specific required fields
      fleetSize: 75,
      deliveryRangeKm: 1200
    },
    position: { x: 1200, y: 200 },
  },
  {
    id: 'multi-channel-retail-1',
    type: 'retailerNode',
    data: {
      label: 'Multi-Channel Retail',
      description: 'Complex retail and B2B channels',
      type: 'Retailer',
      capacity: 25000,
      leadTime: 3,
      riskScore: 0.2,
      location: { lat: 51.507, lng: -0.128, country: 'GBR' },
      address: 'London Multi-Channel Retail, UK',
      country: 'GBR',
      // Retailer-specific required fields
      demandRate: 1000 // units per day
    },
    position: { x: 1450, y: 250 },
  }
]; 