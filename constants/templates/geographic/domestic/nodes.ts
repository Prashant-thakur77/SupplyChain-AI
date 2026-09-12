import { Node } from 'reactflow';

// Use when: operationsLocation = ["domestic"] (single domestic market)
// Characteristics: Domestic/regional operations, Tier 1-2 suppliers, Road/rail transport
// Typical risks: Weather disasters, Labor strikes, Carrier capacity
export const DOMESTIC_REGIONAL_TEMPLATE: Node[] = [
  {
    id: 'local-supplier-1',
    type: 'supplierNode',
    data: {
      label: 'Local Supplier',
      description: 'Regional raw material supplier',
      type: 'Supplier',
      capacity: 15000,
      leadTime: 7,
      riskScore: 0.2,
      location: { lat: 41.878, lng: -87.629, country: 'USA' },
      address: 'Chicago Regional Supplier, IL',
      country: 'USA',
      // Supplier-specific required fields
      supplierTier: 'tier1',
      supplyCapacity: 15000,
      materialType: 'Raw Materials',
      reliabilityPct: 92
    },
    position: { x: 100, y: 100 },
  },
  {
    id: 'domestic-manufacturer-1',
    type: 'factoryNode',
    data: {
      label: 'Regional Manufacturing',
      description: 'Domestic manufacturing facility',
      type: 'Factory',
      capacity: 12000,
      leadTime: 5,
      riskScore: 0.1,
      location: { lat: 39.739, lng: -104.990, country: 'USA' },
      address: 'Denver Manufacturing, CO',
      country: 'USA',
      // Factory-specific required fields
      cycleTime: 3, // days per unit
      utilizationPct: 88
    },
    position: { x: 450, y: 150 },
  },
  {
    id: 'regional-warehouse-1',
    type: 'warehouseNode',
    data: {
      label: 'Regional Warehouse',
      description: 'Central distribution warehouse',
      type: 'Warehouse',
      capacity: 20000,
      leadTime: 2,
      riskScore: 0.1,
      location: { lat: 32.776, lng: -96.797, country: 'USA' },
      address: 'Dallas Distribution Center, TX',
      country: 'USA',
      // Warehouse-specific required fields
      storageCapacity: 20000,
      temperatureControl: false,
      storageCostPerUnit: 2.0,
      handlingCostPerUnit: 1.0
    },
    position: { x: 750, y: 120 },
  },
  {
    id: 'local-distribution-1',
    type: 'distributionNode',
    data: {
      label: 'Local Distribution',
      description: 'Regional distribution network',
      type: 'Distribution',
      capacity: 15000,
      leadTime: 1,
      riskScore: 0.1,
      location: { lat: 33.749, lng: -84.388, country: 'USA' },
      address: 'Atlanta Distribution, GA',
      country: 'USA',
      // Distribution-specific required fields
      fleetSize: 40,
      deliveryRangeKm: 500
    },
    position: { x: 1050, y: 200 },
  },
  {
    id: 'regional-retail-1',
    type: 'retailerNode',
    data: {
      label: 'Regional Retail',
      description: 'Local retail stores',
      type: 'Retailer',
      capacity: 10000,
      leadTime: 1,
      riskScore: 0.1,
      location: { lat: 34.052, lng: -118.243, country: 'USA' },
      address: 'West Coast Retail, CA',
      country: 'USA',
      // Retailer-specific required fields
      demandRate: 500 // units per day
    },
    position: { x: 1350, y: 250 },
  }
]; 