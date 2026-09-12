import { Node } from 'reactflow';

// Use when: productCharacteristics includes "hazardous" OR "dangerous"
// Characteristics: Hazardous materials, Special handling, Regulatory compliance
// Typical risks: Safety incidents, Regulatory compliance, Environmental impact
export const HAZARDOUS_MATERIALS_TEMPLATE: Node[] = [
  {
    id: 'chemical-supplier-1',
    type: 'supplierNode',
    data: {
      label: 'Chemical Supplier',
      description: 'Certified hazardous chemical supplier',
      type: 'Supplier',
      capacity: 10000,
      leadTime: 14,
      riskScore: 0.6,
      location: { lat: 52.520, lng: 13.405, country: 'DEU' },
      address: 'Hamburg Chemical Complex, Germany',
      country: 'DEU',
      // Supplier-specific required fields
      supplierTier: 'tier1',
      supplyCapacity: 10000,
      materialType: 'Hazardous Chemicals',
      reliabilityPct: 95
    },
    position: { x: 100, y: 100 },
  },
  {
    id: 'hazmat-processing-1',
    type: 'factoryNode',
    data: {
      label: 'Hazmat Processing',
      description: 'Specialized hazardous material processing',
      type: 'Factory',
      capacity: 8000,
      leadTime: 7,
      riskScore: 0.4,
      location: { lat: 29.760, lng: -95.369, country: 'USA' },
      address: 'Texas Chemical Processing, TX',
      country: 'USA',
      // Factory-specific required fields
      cycleTime: 3, // days per batch
      utilizationPct: 70
    },
    position: { x: 450, y: 150 },
  },
  {
    id: 'secure-hazmat-storage-1',
    type: 'warehouseNode',
    data: {
      label: 'Hazmat Storage',
      description: 'Certified hazardous material storage facility',
      type: 'Warehouse',
      capacity: 12000,
      leadTime: 1,
      riskScore: 0.5,
      location: { lat: 32.776, lng: -96.797, country: 'USA' },
      address: 'Dallas Hazmat Storage, TX',
      country: 'USA',
      // Warehouse-specific required fields
      storageCapacity: 12000,
      temperatureControl: true,
      storageCostPerUnit: 12.0,
      handlingCostPerUnit: 6.5
    },
    position: { x: 750, y: 120 },
  },
  {
    id: 'hazmat-distribution-1',
    type: 'distributionNode',
    data: {
      label: 'Hazmat Distribution',
      description: 'Specialized hazardous material transport',
      type: 'Distribution',
      capacity: 6000,
      leadTime: 2,
      riskScore: 0.6,
      location: { lat: 39.739, lng: -104.990, country: 'USA' },
      address: 'Denver Hazmat Transport, CO',
      country: 'USA',
      // Distribution-specific required fields
      fleetSize: 30,
      deliveryRangeKm: 800
    },
    position: { x: 1050, y: 200 },
  },
  {
    id: 'industrial-customer-1',
    type: 'retailerNode',
    data: {
      label: 'Industrial Customer',
      description: 'Licensed industrial customers',
      type: 'Retailer',
      capacity: 4000,
      leadTime: 1,
      riskScore: 0.3,
      location: { lat: 41.878, lng: -87.629, country: 'USA' },
      address: 'Chicago Industrial District, IL',
      country: 'USA',
      // Retailer-specific required fields
      demandRate: 300 // units per day
    },
    position: { x: 1350, y: 250 },
  }
]; 