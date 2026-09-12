import { Node } from 'reactflow';

// Use when: productCharacteristics includes "high_value" AND operationsLocation includes global markets
// Characteristics: High-value/low-volume goods, Global operations, Air shipping, Security focus
// Typical risks: Theft/security, Political/regulatory, Cybersecurity
export const HIGH_VALUE_GLOBAL_TEMPLATE: Node[] = [
  {
    id: 'precision-supplier-1',
    type: 'supplierNode',
    data: {
      label: 'Precision Components',
      description: 'High-precision manufacturing components',
      type: 'Supplier',
      capacity: 5000,
      leadTime: 30,
      riskScore: 0.3,
      location: { lat: 47.368, lng: 8.539, country: 'CHE' },
      address: 'Zurich Precision Industries, Switzerland',
      country: 'CHE',
      // Supplier-specific required fields
      supplierTier: 'tier1',
      supplyCapacity: 5000,
      materialType: 'Precision Components',
      reliabilityPct: 98
    },
    position: { x: 100, y: 100 },
  },
  {
    id: 'aerospace-supplier-1',
    type: 'supplierNode',
    data: {
      label: 'Aerospace Supplier',
      description: 'Certified aerospace components',
      type: 'Supplier',
      capacity: 3000,
      leadTime: 45,
      riskScore: 0.2,
      location: { lat: 48.858, lng: 2.294, country: 'FRA' },
      address: 'Toulouse Aerospace Complex, France',
      country: 'FRA',
      // Supplier-specific required fields
      supplierTier: 'tier1',
      supplyCapacity: 3000,
      materialType: 'Aerospace Components',
      reliabilityPct: 99
    },
    position: { x: 100, y: 250 },
  },
  {
    id: 'assembly-facility-1',
    type: 'factoryNode',
    data: {
      label: 'High-Value Assembly',
      description: 'Secure assembly of high-value products',
      type: 'Factory',
      capacity: 2000,
      leadTime: 21,
      riskScore: 0.1,
      location: { lat: 52.520, lng: 13.405, country: 'DEU' },
      address: 'Munich High-Tech Assembly, Germany',
      country: 'DEU',
      // Factory-specific required fields
      cycleTime: 10, // days per unit
      utilizationPct: 75
    },
    position: { x: 450, y: 175 },
  },
  {
    id: 'secure-warehouse-1',
    type: 'warehouseNode',
    data: {
      label: 'Secure Storage',
      description: 'High-security storage facility',
      type: 'Warehouse',
      capacity: 8000,
      leadTime: 2,
      riskScore: 0.1,
      location: { lat: 51.507, lng: -0.128, country: 'GBR' },
      address: 'London Secure Storage, UK',
      country: 'GBR',
      // Warehouse-specific required fields
      storageCapacity: 8000,
      temperatureControl: true,
      storageCostPerUnit: 15.0,
      handlingCostPerUnit: 8.5
    },
    position: { x: 750, y: 120 },
  },
  {
    id: 'express-distribution-1',
    type: 'distributionNode',
    data: {
      label: 'Express Distribution',
      description: 'High-priority express delivery network',
      type: 'Distribution',
      capacity: 5000,
      leadTime: 1,
      riskScore: 0.2,
      location: { lat: 40.712, lng: -74.006, country: 'USA' },
      address: 'New York Express Hub, NY',
      country: 'USA',
      // Distribution-specific required fields
      fleetSize: 20,
      deliveryRangeKm: 1000
    },
    position: { x: 1050, y: 200 },
  },
  {
    id: 'premium-retail-1',
    type: 'retailerNode',
    data: {
      label: 'Premium Retail',
      description: 'High-end retail channels',
      type: 'Retailer',
      capacity: 3000,
      leadTime: 3,
      riskScore: 0.1,
      location: { lat: 37.774, lng: -122.419, country: 'USA' },
      address: 'San Francisco Premium Stores, CA',
      country: 'USA',
      // Retailer-specific required fields
      demandRate: 150 // units per day
    },
    position: { x: 1350, y: 250 },
  }
]; 