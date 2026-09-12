import { Node } from 'reactflow';

// Use when: supplierTiers = "tier1" (simple supply chain)
// Characteristics: Direct suppliers only, Simple structure, Minimal tiers
// Typical risks: Single points of failure, Limited supplier diversification
export const TIER1_SIMPLE_TEMPLATE: Node[] = [
  {
    id: 'tier1-supplier-1',
    type: 'supplierNode',
    data: {
      label: 'Primary Supplier',
      description: 'Main Tier 1 supplier',
      type: 'Supplier',
      capacity: 25000,
      leadTime: 10,
      riskScore: 0.2,
      location: { lat: 42.331, lng: -83.045, country: 'USA' },
      address: 'Detroit Primary Supplier, MI',
      country: 'USA',
      // Supplier-specific required fields
      supplierTier: 'tier1',
      supplyCapacity: 25000,
      materialType: 'Primary Components',
      reliabilityPct: 94
    },
    position: { x: 100, y: 150 },
  },
  {
    id: 'main-manufacturing-1',
    type: 'factoryNode',
    data: {
      label: 'Main Manufacturing',
      description: 'Primary manufacturing facility',
      type: 'Factory',
      capacity: 20000,
      leadTime: 5,
      riskScore: 0.1,
      location: { lat: 41.878, lng: -87.629, country: 'USA' },
      address: 'Chicago Manufacturing, IL',
      country: 'USA',
      // Factory-specific required fields
      cycleTime: 2, // days per unit
      utilizationPct: 90
    },
    position: { x: 450, y: 150 },
  },
  {
    id: 'central-warehouse-1',
    type: 'warehouseNode',
    data: {
      label: 'Central Warehouse',
      description: 'Main distribution warehouse',
      type: 'Warehouse',
      capacity: 30000,
      leadTime: 2,
      riskScore: 0.1,
      location: { lat: 39.739, lng: -104.990, country: 'USA' },
      address: 'Denver Central Warehouse, CO',
      country: 'USA',
      // Warehouse-specific required fields
      storageCapacity: 30000,
      temperatureControl: false,
      storageCostPerUnit: 1.8,
      handlingCostPerUnit: 0.9
    },
    position: { x: 750, y: 120 },
  },
  {
    id: 'direct-distribution-1',
    type: 'distributionNode',
    data: {
      label: 'Direct Distribution',
      description: 'Direct-to-customer distribution',
      type: 'Distribution',
      capacity: 18000,
      leadTime: 2,
      riskScore: 0.1,
      location: { lat: 32.776, lng: -96.797, country: 'USA' },
      address: 'Dallas Distribution, TX',
      country: 'USA',
      // Distribution-specific required fields
      fleetSize: 35,
      deliveryRangeKm: 600
    },
    position: { x: 1050, y: 200 },
  },
  {
    id: 'end-customer-1',
    type: 'retailerNode',
    data: {
      label: 'End Customer',
      description: 'Direct customers',
      type: 'Retailer',
      capacity: 15000,
      leadTime: 1,
      riskScore: 0.1,
      location: { lat: 33.749, lng: -84.388, country: 'USA' },
      address: 'Southeast Customers, GA',
      country: 'USA',
      // Retailer-specific required fields
      demandRate: 750 // units per day
    },
    position: { x: 1350, y: 250 },
  }
]; 