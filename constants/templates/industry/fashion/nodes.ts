import { Node } from 'reactflow';

// Use when: industry = "Apparel, Textiles & Fashion"
// Characteristics: Seasonal demand, Global sourcing, Fast fashion cycles
// Typical risks: Labor issues, Quality control, Demand volatility, Trade regulations
export const FASHION_SEASONAL_TEMPLATE: Node[] = [
  {
    id: 'textile-supplier-1',
    type: 'supplierNode',
    data: {
      label: 'Textile Mill',
      description: 'Fabric and textile production',
      type: 'Supplier',
      capacity: 25000,
      leadTime: 21,
      riskScore: 0.4,
      location: { lat: 23.810, lng: 90.412, country: 'BGD' },
      address: 'Dhaka Textile District, Bangladesh',
      country: 'BGD',
      // Supplier-specific required fields
      supplierTier: 'tier2',
      supplyCapacity: 25000,
      materialType: 'Textiles & Fabrics',
      reliabilityPct: 84
    },
    position: { x: 100, y: 100 },
  },
  {
    id: 'garment-factory-1',
    type: 'factoryNode',
    data: {
      label: 'Garment Factory',
      description: 'Clothing manufacturing and assembly',
      type: 'Factory',
      capacity: 15000,
      leadTime: 14,
      riskScore: 0.5,
      location: { lat: 10.762, lng: 106.660, country: 'VNM' },
      address: 'Ho Chi Minh Garment District, Vietnam',
      country: 'VNM',
      // Factory-specific required fields
      cycleTime: 7, // days per batch
      utilizationPct: 82
    },
    position: { x: 450, y: 150 },
  },
  {
    id: 'distribution-center-1',
    type: 'warehouseNode',
    data: {
      label: 'Fashion DC',
      description: 'Apparel distribution and sorting center',
      type: 'Warehouse',
      capacity: 30000,
      leadTime: 5,
      riskScore: 0.2,
      location: { lat: 33.749, lng: -84.388, country: 'USA' },
      address: 'Atlanta Fashion Hub, GA',
      country: 'USA',
      // Warehouse-specific required fields
      storageCapacity: 30000,
      temperatureControl: false,
      storageCostPerUnit: 1.8,
      handlingCostPerUnit: 1.1
    },
    position: { x: 750, y: 120 },
  },
  {
    id: 'retail-distribution-1',
    type: 'distributionNode',
    data: {
      label: 'Retail Distribution',
      description: 'Fashion retail distribution network',
      type: 'Distribution',
      capacity: 20000,
      leadTime: 3,
      riskScore: 0.3,
      location: { lat: 40.712, lng: -74.006, country: 'USA' },
      address: 'New York Fashion District, NY',
      country: 'USA',
      // Distribution-specific required fields
      fleetSize: 60,
      deliveryRangeKm: 400
    },
    position: { x: 1050, y: 200 },
  },
  {
    id: 'fashion-retail-1',
    type: 'retailerNode',
    data: {
      label: 'Fashion Retail',
      description: 'Clothing stores and boutiques',
      type: 'Retailer',
      capacity: 12000,
      leadTime: 2,
      riskScore: 0.2,
      location: { lat: 34.052, lng: -118.243, country: 'USA' },
      address: 'Los Angeles Fashion District, CA',
      country: 'USA',
      // Retailer-specific required fields
      demandRate: 600 // units per day
    },
    position: { x: 1350, y: 250 },
  }
]; 