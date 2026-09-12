import { Node } from 'reactflow';

// Use when: industry = "Pharma & Life Sciences"
// Characteristics: Regulated/cold chain, Quality controls, Global distribution
// Typical risks: Regulatory changes, Quality control, Temperature control
export const PHARMA_REGULATED_TEMPLATE: Node[] = [
  {
    id: 'api-supplier-1',
    type: 'supplierNode',
    data: {
      label: 'API Supplier',
      description: 'Active pharmaceutical ingredient supplier',
      type: 'Supplier',
      capacity: 20000,
      leadTime: 45,
      riskScore: 0.5,
      location: { lat: 19.076, lng: 72.877, country: 'IND' },
      address: 'Mumbai Pharmaceutical Complex, India',
      country: 'IND',
      // Supplier-specific required fields
      supplierTier: 'tier2',
      supplyCapacity: 20000,
      materialType: 'Active Pharmaceutical Ingredients',
      reliabilityPct: 96
    },
    position: { x: 100, y: 100 },
  },
  {
    id: 'excipient-supplier-1',
    type: 'supplierNode',
    data: {
      label: 'Excipient Supplier',
      description: 'Pharmaceutical excipients and raw materials',
      type: 'Supplier',
      capacity: 50000,
      leadTime: 30,
      riskScore: 0.3,
      location: { lat: 52.520, lng: 13.405, country: 'DEU' },
      address: 'Berlin Chemical District, Germany',
      country: 'DEU',
      // Supplier-specific required fields
      supplierTier: 'tier2',
      supplyCapacity: 50000,
      materialType: 'Pharmaceutical Excipients',
      reliabilityPct: 94
    },
    position: { x: 100, y: 250 },
  },
  {
    id: 'manufacturing-plant-1',
    type: 'factoryNode',
    data: {
      label: 'Manufacturing Facility',
      description: 'GMP-certified drug manufacturing',
      type: 'Factory',
      capacity: 15000,
      leadTime: 21,
      riskScore: 0.2,
      location: { lat: 40.712, lng: -74.006, country: 'USA' },
      address: 'New Jersey Pharma Park, NJ',
      country: 'USA',
      // Factory-specific required fields
      cycleTime: 14, // days per batch
      utilizationPct: 78
    },
    position: { x: 500, y: 175 },
  },
  {
    id: 'cold-storage-1',
    type: 'warehouseNode',
    data: {
      label: 'Cold Chain Warehouse',
      description: 'Temperature-controlled pharmaceutical storage',
      type: 'Warehouse',
      capacity: 10000,
      leadTime: 3,
      riskScore: 0.3,
      location: { lat: 41.878, lng: -87.629, country: 'USA' },
      address: 'Chicago Cold Storage, IL',
      country: 'USA',
      // Warehouse-specific required fields
      storageCapacity: 10000,
      temperatureControl: true,
      storageCostPerUnit: 8.5,
      handlingCostPerUnit: 3.2
    },
    position: { x: 800, y: 100 },
  },
  {
    id: 'regional-distribution-1',
    type: 'distributionNode',
    data: {
      label: 'Regional Distribution',
      description: 'Pharmaceutical distribution network',
      type: 'Distribution',
      capacity: 8000,
      leadTime: 5,
      riskScore: 0.2,
      location: { lat: 33.749, lng: -84.388, country: 'USA' },
      address: 'Atlanta Distribution Hub, GA',
      country: 'USA',
      // Distribution-specific required fields
      fleetSize: 35,
      deliveryRangeKm: 800
    },
    position: { x: 1100, y: 175 },
  },
  {
    id: 'pharmacy-retail-1',
    type: 'retailerNode',
    data: {
      label: 'Pharmacy Network',
      description: 'Retail pharmacy chain',
      type: 'Retailer',
      capacity: 5000,
      leadTime: 2,
      riskScore: 0.1,
      location: { lat: 39.952, lng: -75.165, country: 'USA' },
      address: 'Philadelphia Pharmacy Network, PA',
      country: 'USA',
      // Retailer-specific required fields
      demandRate: 500 // units per day
    },
    position: { x: 1400, y: 250 },
  }
]; 