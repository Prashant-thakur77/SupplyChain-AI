import { Node } from 'reactflow';

// Use when: industry = "Electronics & High Tech"
// Characteristics: Global supply chains, Tier 3+ suppliers, High-value/low-volume, Air/Sea shipping
// Typical risks: Political/regulatory, Supplier concentration, Cybersecurity
export const ELECTRONICS_TEMPLATE: Node[] = [
  {
    id: 'chip-supplier-1',
    type: 'supplierNode',
    data: {
      label: 'Semiconductor Supplier',
      description: 'Tier 3 chip manufacturer in Taiwan',
      type: 'Supplier',
      capacity: 50000,
      leadTime: 21,
      riskScore: 0.6,
      location: { lat: 25.032, lng: 121.565, country: 'TWN' },
      address: 'Hsinchu Science Park, Taiwan',
      country: 'TWN',
      // Supplier-specific required fields
      supplierTier: 'tier3+',
      supplyCapacity: 50000,
      materialType: 'Semiconductors',
      reliabilityPct: 92
    },
    position: { x: 100, y: 50 },
  },
  {
    id: 'component-supplier-1',
    type: 'supplierNode',
    data: {
      label: 'Component Supplier',
      description: 'Tier 2 PCB and components supplier in Shenzhen',
      type: 'Supplier',
      capacity: 80000,
      leadTime: 14,
      riskScore: 0.4,
      location: { lat: 22.543, lng: 114.057, country: 'CHN' },
      address: 'Shenzhen Tech Hub, China',
      country: 'CHN',
      // Supplier-specific required fields
      supplierTier: 'tier2',
      supplyCapacity: 80000,
      materialType: 'PCB & Electronic Components',
      reliabilityPct: 88
    },
    position: { x: 400, y: 120 },
  },
  {
    id: 'assembly-factory-1',
    type: 'factoryNode',
    data: {
      label: 'Assembly Factory',
      description: 'Tier 1 final assembly facility in Vietnam',
      type: 'Factory',
      capacity: 30000,
      leadTime: 7,
      riskScore: 0.3,
      location: { lat: 10.823, lng: 106.629, country: 'VNM' },
      address: 'Ho Chi Minh Industrial Zone, Vietnam',
      country: 'VNM',
      // Factory-specific required fields
      cycleTime: 0.5, // days per unit
      utilizationPct: 85
    },
    position: { x: 700, y: 200 },
  },
  {
    id: 'asia-port-1',
    type: 'portNode',
    data: {
      label: 'Singapore Port',
      description: 'Major Asian shipping hub',
      type: 'Port',
      capacity: 100000,
      leadTime: 2,
      riskScore: 0.2,
      location: { lat: 1.290, lng: 103.851, country: 'SGP' },
      address: 'Port of Singapore Authority, Singapore',
      country: 'SGP'
    },
    position: { x: 1000, y: 150 },
  },
  {
    id: 'us-port-1',
    type: 'portNode',
    data: {
      label: 'Los Angeles Port',
      description: 'US West Coast entry point',
      type: 'Port',
      capacity: 80000,
      leadTime: 1,
      riskScore: 0.3,
      location: { lat: 33.739, lng: -118.262, country: 'USA' },
      address: 'Port of Los Angeles, CA',
      country: 'USA'
    },
    position: { x: 1300, y: 200 },
  },
  {
    id: 'us-warehouse-1',
    type: 'warehouseNode',
    data: {
      label: 'West Coast DC',
      description: 'Primary distribution center',
      type: 'Warehouse',
      capacity: 40000,
      leadTime: 3,
      riskScore: 0.1,
      location: { lat: 34.052, lng: -118.243, country: 'USA' },
      address: 'Los Angeles Distribution Center, CA',
      country: 'USA',
      // Warehouse-specific required fields
      storageCapacity: 40000,
      temperatureControl: true,
      storageCostPerUnit: 2.5,
      handlingCostPerUnit: 1.2
    },
    position: { x: 1600, y: 120 },
  },
  {
    id: 'retail-distribution-1',
    type: 'distributionNode',
    data: {
      label: 'Retail Distribution',
      description: 'Final mile to retail stores',
      type: 'Distribution',
      capacity: 20000,
      leadTime: 2,
      riskScore: 0.1,
      location: { lat: 37.774, lng: -122.419, country: 'USA' },
      address: 'San Francisco Bay Area, CA',
      country: 'USA',
      // Distribution-specific required fields
      fleetSize: 50,
      deliveryRangeKm: 200
    },
    position: { x: 1900, y: 200 },
  }
]; 