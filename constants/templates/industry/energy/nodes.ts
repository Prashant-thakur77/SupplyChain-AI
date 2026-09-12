import { Node } from 'reactflow';

// Use when: industry = "Energy & Utilities"
// Characteristics: Bulk commodities, Pipeline/rail transport, Global operations
// Typical risks: Geopolitical, Weather, Infrastructure, Price volatility
export const ENERGY_BULK_TEMPLATE: Node[] = [
  {
    id: 'oil-extraction-1',
    type: 'supplierNode',
    data: {
      label: 'Oil Extraction',
      description: 'Crude oil extraction and production',
      type: 'Supplier',
      capacity: 50000,
      leadTime: 7,
      riskScore: 0.6,
      location: { lat: 29.760, lng: -95.369, country: 'USA' },
      address: 'Gulf Coast Oil Fields, TX',
      country: 'USA',
      // Supplier-specific required fields
      supplierTier: 'tier1',
      supplyCapacity: 50000,
      materialType: 'Crude Oil',
      reliabilityPct: 78
    },
    position: { x: 100, y: 100 },
  },
  {
    id: 'refinery-1',
    type: 'factoryNode',
    data: {
      label: 'Oil Refinery',
      description: 'Crude oil refining and processing',
      type: 'Factory',
      capacity: 40000,
      leadTime: 14,
      riskScore: 0.4,
      location: { lat: 29.950, lng: -93.997, country: 'USA' },
      address: 'Texas Gulf Refinery, TX',
      country: 'USA',
      // Factory-specific required fields
      cycleTime: 5, // days per batch
      utilizationPct: 89
    },
    position: { x: 450, y: 150 },
  },
  {
    id: 'pipeline-terminal-1',
    type: 'warehouseNode',
    data: {
      label: 'Pipeline Terminal',
      description: 'Bulk fuel storage and distribution terminal',
      type: 'Warehouse',
      capacity: 100000,
      leadTime: 2,
      riskScore: 0.3,
      location: { lat: 41.878, lng: -87.629, country: 'USA' },
      address: 'Chicago Pipeline Terminal, IL',
      country: 'USA',
      // Warehouse-specific required fields
      storageCapacity: 100000,
      temperatureControl: false,
      storageCostPerUnit: 0.8,
      handlingCostPerUnit: 0.3
    },
    position: { x: 750, y: 120 },
  },
  {
    id: 'fuel-distribution-1',
    type: 'distributionNode',
    data: {
      label: 'Fuel Distribution',
      description: 'Regional fuel distribution network',
      type: 'Distribution',
      capacity: 60000,
      leadTime: 3,
      riskScore: 0.2,
      location: { lat: 39.739, lng: -104.990, country: 'USA' },
      address: 'Denver Fuel Distribution, CO',
      country: 'USA',
      // Distribution-specific required fields
      fleetSize: 80,
      deliveryRangeKm: 1000
    },
    position: { x: 1050, y: 200 },
  },
  {
    id: 'gas-station-network-1',
    type: 'retailerNode',
    data: {
      label: 'Gas Station Network',
      description: 'Retail fuel stations',
      type: 'Retailer',
      capacity: 30000,
      leadTime: 1,
      riskScore: 0.1,
      location: { lat: 39.952, lng: -75.165, country: 'USA' },
      address: 'Regional Gas Stations, Multiple States',
      country: 'USA',
      // Retailer-specific required fields
      demandRate: 2500 // gallons per day
    },
    position: { x: 1350, y: 250 },
  }
]; 