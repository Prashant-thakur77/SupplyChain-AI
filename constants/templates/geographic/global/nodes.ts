import { Node } from 'reactflow';

// Use when: operationsLocation includes multiple global regions (length > 2)
// Characteristics: Global operations, Multi-regional, Sea/air shipping, Complex logistics
// Typical risks: Political/regulatory, Currency fluctuations, Geopolitical tensions
export const GLOBAL_NETWORK_TEMPLATE: Node[] = [
  {
    id: 'asia-supplier-1',
    type: 'supplierNode',
    data: {
      label: 'Asia Supplier',
      description: 'Primary Asian manufacturing supplier',
      type: 'Supplier',
      capacity: 80000,
      leadTime: 21,
      riskScore: 0.4,
      location: { lat: 22.543, lng: 114.057, country: 'CHN' },
      address: 'Shenzhen Manufacturing Hub, China',
      country: 'CHN',
      // Supplier-specific required fields
      supplierTier: 'tier1',
      supplyCapacity: 80000,
      materialType: 'Manufactured Components',
      reliabilityPct: 87
    },
    position: { x: 100, y: 100 },
  },
  {
    id: 'europe-supplier-1',
    type: 'supplierNode',
    data: {
      label: 'Europe Supplier',
      description: 'European precision components supplier',
      type: 'Supplier',
      capacity: 40000,
      leadTime: 14,
      riskScore: 0.2,
      location: { lat: 52.520, lng: 13.405, country: 'DEU' },
      address: 'Berlin Industrial District, Germany',
      country: 'DEU',
      // Supplier-specific required fields
      supplierTier: 'tier1',
      supplyCapacity: 40000,
      materialType: 'Precision Components',
      reliabilityPct: 96
    },
    position: { x: 100, y: 250 },
  },
  {
    id: 'global-assembly-1',
    type: 'factoryNode',
    data: {
      label: 'Global Assembly Hub',
      description: 'Multi-regional assembly facility',
      type: 'Factory',
      capacity: 60000,
      leadTime: 10,
      riskScore: 0.3,
      location: { lat: 1.290, lng: 103.851, country: 'SGP' },
      address: 'Singapore Manufacturing Hub',
      country: 'SGP',
      // Factory-specific required fields
      cycleTime: 4, // days per unit
      utilizationPct: 84
    },
    position: { x: 450, y: 175 },
  },
  {
    id: 'americas-warehouse-1',
    type: 'warehouseNode',
    data: {
      label: 'Americas Hub',
      description: 'North American distribution center',
      type: 'Warehouse',
      capacity: 50000,
      leadTime: 3,
      riskScore: 0.2,
      location: { lat: 41.878, lng: -87.629, country: 'USA' },
      address: 'Chicago Global Hub, IL',
      country: 'USA',
      // Warehouse-specific required fields
      storageCapacity: 50000,
      temperatureControl: true,
      storageCostPerUnit: 4.0,
      handlingCostPerUnit: 2.0
    },
    position: { x: 750, y: 120 },
  },
  {
    id: 'europe-warehouse-1',
    type: 'warehouseNode',
    data: {
      label: 'Europe Hub',
      description: 'European distribution center',
      type: 'Warehouse',
      capacity: 35000,
      leadTime: 2,
      riskScore: 0.1,
      location: { lat: 52.373, lng: 4.890, country: 'NLD' },
      address: 'Amsterdam Distribution Hub, Netherlands',
      country: 'NLD',
      // Warehouse-specific required fields
      storageCapacity: 35000,
      temperatureControl: true,
      storageCostPerUnit: 5.0,
      handlingCostPerUnit: 2.5
    },
    position: { x: 750, y: 300 },
  },
  {
    id: 'global-distribution-1',
    type: 'distributionNode',
    data: {
      label: 'Global Distribution',
      description: 'Worldwide distribution network',
      type: 'Distribution',
      capacity: 40000,
      leadTime: 5,
      riskScore: 0.3,
      location: { lat: 51.507, lng: -0.128, country: 'GBR' },
      address: 'London Global Logistics, UK',
      country: 'GBR',
      // Distribution-specific required fields
      fleetSize: 100,
      deliveryRangeKm: 2000
    },
    position: { x: 1050, y: 200 },
  },
  {
    id: 'multi-market-retail-1',
    type: 'retailerNode',
    data: {
      label: 'Multi-Market Retail',
      description: 'Global retail presence',
      type: 'Retailer',
      capacity: 25000,
      leadTime: 7,
      riskScore: 0.2,
      location: { lat: 35.676, lng: 139.650, country: 'JPN' },
      address: 'Tokyo Retail Network, Japan',
      country: 'JPN',
      // Retailer-specific required fields
      demandRate: 1200 // units per day
    },
    position: { x: 1350, y: 250 },
  }
]; 