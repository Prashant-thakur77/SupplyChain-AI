import { Node } from 'reactflow';

// Legacy template - Fallback when no specific template matches
// Basic supply chain structure with validation-compliant default values
export const INITIAL_NODES: Node[] = [
  {
    id: 'supplier-1',
    type: 'supplierNode',
    data: {
      label: 'Supplier',
      description: 'Primary supplier',
      type: 'Supplier',
      capacity: 10000,
      leadTime: 14,
      riskScore: 0.3,
      location: { lat: 25.032, lng: 121.565, country: 'TWN' },
      address: 'Hsinchu Science Park, Taiwan',
      country: 'TWN',
      // Supplier-specific required fields
      supplierTier: 'tier1',
      supplyCapacity: 10000,
      materialType: 'Components',
      reliabilityPct: 85
    },
    position: { x: 50, y: 150 },
  },
  {
    id: 'factory-1',
    type: 'factoryNode',
    data: {
      label: 'Assembly Plant',
      description: 'Manufacturing facility',
      type: 'Factory',
      capacity: 5000,
      leadTime: 7,
      riskScore: 0.6,
      location: { lat: 22.543, lng: 114.057, country: 'CHN' },
      address: 'Longhua District, Shenzhen, China',
      country: 'CHN',
      // Factory-specific required fields
      cycleTime: 3, // days per unit
      utilizationPct: 80
    },
    position: { x: 350, y: 250 },
  },
  {
    id: 'port-1',
    type: 'portNode',
    data: {
      label: 'Port of Shenzhen',
      description: 'Shipping port',
      type: 'Port',
      capacity: 100000,
      leadTime: 3,
      riskScore: 0.4,
      location: { lat: 22.543, lng: 114.057, country: 'CHN' },
      address: 'Yantian Port, Shenzhen, China',
      country: 'CHN'
    },
    position: { x: 650, y: 150 },
  },
  {
    id: 'warehouse-1',
    type: 'warehouseNode',
    data: {
      label: 'US West Coast Distribution',
      description: 'Distribution warehouse',
      type: 'Warehouse',
      capacity: 20000,
      leadTime: 2,
      riskScore: 0.2,
      location: { lat: 34.052, lng: -118.243, country: 'USA' },
      address: 'Los Angeles, CA',
      country: 'USA',
      // Warehouse-specific required fields
      storageCapacity: 20000,
      temperatureControl: false,
      storageCostPerUnit: 2.0,
      handlingCostPerUnit: 1.0
    },
    position: { x: 950, y: 250 },
  },
  {
    id: 'distribution-1',
    type: 'distributionNode',
    data: {
      label: 'National Retail Distribution',
      description: 'Distribution network',
      type: 'Distribution',
      capacity: 15000,
      leadTime: 3,
      riskScore: 0.3,
      location: { lat: 41.878, lng: -87.629, country: 'USA' },
      address: 'Chicago, IL',
      country: 'USA',
      // Distribution-specific required fields
      fleetSize: 25,
      deliveryRangeKm: 500
    },
    position: { x: 1250, y: 150 },
  }
]; 