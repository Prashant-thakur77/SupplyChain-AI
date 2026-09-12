import { Node } from 'reactflow';

// Use when: industry = "Food & Beverage" OR productCharacteristics includes "perishable"
// Characteristics: Cold chain, Perishable goods, Regional sourcing, Time-sensitive
// Typical risks: Weather, Temperature control, Spoilage, Health regulations
export const FOOD_BEVERAGE_COLD_CHAIN_TEMPLATE: Node[] = [
  {
    id: 'farm-supplier-1',
    type: 'supplierNode',
    data: {
      label: 'Organic Farm',
      description: 'Organic produce and raw ingredients',
      type: 'Supplier',
      capacity: 5000,
      leadTime: 2,
      riskScore: 0.4,
      location: { lat: 36.778, lng: -119.417, country: 'USA' },
      address: 'Central Valley Farms, CA',
      country: 'USA',
      // Supplier-specific required fields
      supplierTier: 'tier1',
      supplyCapacity: 5000,
      materialType: 'Fresh Produce & Raw Ingredients',
      reliabilityPct: 82
    },
    position: { x: 100, y: 100 },
  },
  {
    id: 'dairy-supplier-1',
    type: 'supplierNode',
    data: {
      label: 'Dairy Supplier',
      description: 'Fresh dairy products and ingredients',
      type: 'Supplier',
      capacity: 8000,
      leadTime: 1,
      riskScore: 0.3,
      location: { lat: 44.977, lng: -93.265, country: 'USA' },
      address: 'Minnesota Dairy Co-op, MN',
      country: 'USA',
      // Supplier-specific required fields
      supplierTier: 'tier1',
      supplyCapacity: 8000,
      materialType: 'Dairy Products',
      reliabilityPct: 88
    },
    position: { x: 100, y: 250 },
  },
  {
    id: 'processing-plant-1',
    type: 'factoryNode',
    data: {
      label: 'Processing Facility',
      description: 'Food processing and packaging',
      type: 'Factory',
      capacity: 12000,
      leadTime: 3,
      riskScore: 0.2,
      location: { lat: 41.878, lng: -87.629, country: 'USA' },
      address: 'Chicago Food Processing, IL',
      country: 'USA',
      // Factory-specific required fields
      cycleTime: 1.5, // days per batch
      utilizationPct: 86
    },
    position: { x: 450, y: 175 },
  },
  {
    id: 'cold-storage-warehouse-1',
    type: 'warehouseNode',
    data: {
      label: 'Cold Storage',
      description: 'Temperature-controlled food storage',
      type: 'Warehouse',
      capacity: 15000,
      leadTime: 1,
      riskScore: 0.3,
      location: { lat: 39.739, lng: -104.990, country: 'USA' },
      address: 'Denver Cold Storage, CO',
      country: 'USA',
      // Warehouse-specific required fields
      storageCapacity: 15000,
      temperatureControl: true,
      storageCostPerUnit: 3.5,
      handlingCostPerUnit: 1.8
    },
    position: { x: 750, y: 120 },
  },
  {
    id: 'refrigerated-distribution-1',
    type: 'distributionNode',
    data: {
      label: 'Refrigerated Distribution',
      description: 'Cold chain logistics and delivery',
      type: 'Distribution',
      capacity: 10000,
      leadTime: 2,
      riskScore: 0.3,
      location: { lat: 32.776, lng: -96.797, country: 'USA' },
      address: 'Dallas Cold Chain Hub, TX',
      country: 'USA',
      // Distribution-specific required fields
      fleetSize: 45,
      deliveryRangeKm: 600
    },
    position: { x: 1050, y: 200 },
  },
  {
    id: 'grocery-retail-1',
    type: 'retailerNode',
    data: {
      label: 'Grocery Chain',
      description: 'Retail grocery stores',
      type: 'Retailer',
      capacity: 8000,
      leadTime: 1,
      riskScore: 0.2,
      location: { lat: 33.749, lng: -84.388, country: 'USA' },
      address: 'Southeast Grocery Network, GA',
      country: 'USA',
      // Retailer-specific required fields
      demandRate: 800 // units per day
    },
    position: { x: 1350, y: 250 },
  }
]; 