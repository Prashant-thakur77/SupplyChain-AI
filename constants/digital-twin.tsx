import { Factory, Truck, Warehouse, Ship, Building2, Store } from 'lucide-react';
import { Node, Edge } from 'reactflow';
import { PropertySpec, NodeType } from '../lib/types/digital-twin';
import { SUPPLIER_TIER_INFO } from './supply-chain-form';

// Helper function to create supplier tier tooltip text
const createSupplierTierTooltip = () => {
  const tierDescriptions = SUPPLIER_TIER_INFO.tiers
    .map(tier => `• ${tier.level} ${tier.description}`)
    .join('\n');
  
  return `${SUPPLIER_TIER_INFO.description}\n${tierDescriptions}`;
};

// Import all templates from organized structure
import {
  // Industry-specific templates
  ELECTRONICS_TEMPLATE,
  ELECTRONICS_TEMPLATE_EDGES,
  FOOD_BEVERAGE_COLD_CHAIN_TEMPLATE,
  FOOD_BEVERAGE_COLD_CHAIN_TEMPLATE_EDGES,
  AUTOMOTIVE_JIT_TEMPLATE,
  AUTOMOTIVE_JIT_TEMPLATE_EDGES,
  PHARMA_REGULATED_TEMPLATE,
  PHARMA_REGULATED_TEMPLATE_EDGES,
  ENERGY_BULK_TEMPLATE,
  ENERGY_BULK_TEMPLATE_EDGES,
  FASHION_SEASONAL_TEMPLATE,
  FASHION_SEASONAL_TEMPLATE_EDGES,
  
  // Product characteristic-specific templates
  HIGH_VALUE_GLOBAL_TEMPLATE,
  HIGH_VALUE_GLOBAL_TEMPLATE_EDGES,
  HAZARDOUS_MATERIALS_TEMPLATE,
  HAZARDOUS_MATERIALS_TEMPLATE_EDGES,
  
  // Geographic & operational templates
  DOMESTIC_REGIONAL_TEMPLATE,
  DOMESTIC_REGIONAL_TEMPLATE_EDGES,
  GLOBAL_NETWORK_TEMPLATE,
  GLOBAL_NETWORK_TEMPLATE_EDGES,
  
  // Supplier tier-specific templates
  TIER1_SIMPLE_TEMPLATE,
  TIER1_SIMPLE_TEMPLATE_EDGES,
  TIER3_COMPLEX_TEMPLATE,
  TIER3_COMPLEX_TEMPLATE_EDGES,
  
  // Legacy templates
  INITIAL_NODES,
  INITIAL_EDGES
} from './templates';

export const NODE_TYPES = [
  { 
    id: 'Supplier', 
    icon: Factory, 
    description: 'Source of raw materials',
    color: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
    iconColor: 'text-blue-600'
  },
  { 
    id: 'Factory', 
    icon: Building2, 
    description: 'Manufacturing facility',
    color: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
    iconColor: 'text-purple-600'
  },
  { 
    id: 'Port', 
    icon: Ship, 
    description: 'Maritime shipping point',
    color: 'bg-cyan-50 border-cyan-200 hover:bg-cyan-100',
    iconColor: 'text-cyan-600'
  },
  { 
    id: 'Warehouse', 
    icon: Warehouse, 
    description: 'Storage facility',
    color: 'bg-orange-50 border-orange-200 hover:bg-orange-100',
    iconColor: 'text-orange-600'
  },
  { 
    id: 'Distribution', 
    icon: Truck, 
    description: 'Distribution center',
    color: 'bg-green-50 border-green-200 hover:bg-green-100',
    iconColor: 'text-green-600'
  },
  { 
    id: 'Retailer', 
    icon: Store, 
    description: 'Retail outlet',
    color: 'bg-red-50 border-red-200 hover:bg-red-100',
    iconColor: 'text-red-600'
  }
] as const;

// Master list of node-specific form fields, with UI hints (optional flags, info icons, conditional logic)
export const NODE_PROPERTY_SPECS: Record<NodeType, PropertySpec[]> = {
  supplierNode: [
    { 
      key: 'supplierTier',       
      type: 'enum',   
      options: ['tier1', 'tier2', 'tier3+'], 
      label: 'Supplier Tier',
      showInfoIcon: true,
      infoText: createSupplierTierTooltip(),
      defaultValue: 0
    },
    { 
      key: 'supplyCapacity',     
      type: 'number', 
      label: 'Annual Supply Capacity',
      defaultValue: 0
    },
    { 
      key: 'materialType',       
      type: 'string', 
      label: 'Material / Component Type',
      defaultValue: 0
    },
    { 
      key: 'minOrderQty',        
      type: 'number', 
      label: 'Min. Order Qty',
      defaultValue: 1
    },
    {
      key: 'reliabilityPct',     
      type: 'number', 
      label: 'On‑time Reliability (%)',
      optional: true,
      showInfoIcon: true,
      infoText: 'Optional: Percentage of orders delivered on time.',
      defaultValue: 100
    },

  ],

  factoryNode: [
    {
      key: 'cycleTime',          type: 'number', label: 'Cycle Time (days/unit)',
      showInfoIcon: true,
      infoText: 'Time taken to produce one unit from raw materials. '
    },
    {
      key: 'utilizationPct',     type: 'number', label: 'Avg. Utilization (%)',
      showInfoIcon: true,
      infoText: 'Average percentage of capacity actually used over a period.'
    },
  ],

  warehouseNode: [
    { key: 'storageCapacity',    type: 'number', label: 'Total Storage Capacity' },
    { key: 'storageCostPerUnit', type: 'number', label: 'Holding Cost (per unit/day)' },
    {
      key: 'temperatureControl', type: 'boolean', label: 'Temp‑Controlled?',
      showInfoIcon: true,
      infoText: 'Does this warehouse maintain temperature‑controlled storage?'
    },
    {
      key: 'handlingCostPerUnit',type: 'number', label: 'Handling Cost/unit',
      showInfoIcon: true,
      infoText: 'Cost charged per unit for handling and moves within the facility.'
    },
  ],

  distributionNode: [
    {
      key: 'fleetSize',          type: 'number', label: 'Fleet Size (Number of vehicles)',
      showInfoIcon: true,
      infoText: 'Approximate number of vehicles or transport units available. You can enter an approximate value.'
    },
    {
      key: 'deliveryRangeKm',    type: 'number', label: 'Max Delivery Range (km)',
      showInfoIcon: true,
      infoText: 'Typical maximum distance a single delivery vehicle covers in one trip.'
    },
  ],

  portNode: [
    { 
      key: 'annualThroughputTEU', 
      type: 'number', 
      label: 'Throughput (TEU/year)',  
      showInfoIcon: true,
      infoText: 'Approximate annual throughput in TEUs. You can enter an approximate value.'
    },
    { 
      key: 'customsTimeDays',     
      type: 'number', 
      label: 'Customs Delay (days)', 
      showInfoIcon: true,
      infoText: 'Approximate time taken for customs clearance. You can enter an approximate value.' 
    }
  ],

  retailerNode: [
    { key: 'demandRate',         type: 'number', label: 'Avg. Demand (units/day)' },
  ]
};

// Common risk assessment fields that apply to all node types
export const COMMON_RISK_FIELDS: PropertySpec[] = [
  {
    key: 'hasPreKnownRisks',
    type: 'boolean',
    label: 'Are there pre-known risks associated with this node?',
    showInfoIcon: true,
    infoText: 'Toggle if you are aware of specific risks that could affect this node\'s operations.',
    optional: true
  },
  {
    key: 'riskExplanation',
    type: 'textarea',
    label: 'Risk Explanation',
    showInfoIcon: true,
    infoText: 'Describe the specific risks, their potential impact, and any mitigation measures in place.',
    dependsOn: { key: 'hasPreKnownRisks', value: true }
  },
  {
    key: 'riskSeverity',
    type: 'slider',
    label: 'Risk Severity Level',
    min: 1,
    max: 5,
    step: 1,
    defaultValue: 1,
    showInfoIcon: true,
    infoText: 'Rate the severity of the risk from 1 (Low) to 5 (Critical). 1=Low, 2=Minor, 3=Moderate, 4=High, 5=Critical',
    dependsOn: { key: 'hasPreKnownRisks', value: true }
  }
];

// Map node type IDs to property spec keys
export const NODE_TYPE_MAP: Record<string, NodeType> = {
  'Supplier': 'supplierNode',
  'Factory': 'factoryNode', 
  'Warehouse': 'warehouseNode',
  'Distribution': 'distributionNode',
  'Port': 'portNode',
  'Retailer': 'retailerNode'
};

// Template selection logic has been moved to lib/template-selector.ts for better separation of concerns

export const SUPPLY_CHAIN_TEMPLATES = [
  {
    id: 'electronics-global',
    name: 'Electronics & High Tech',
    description: 'Global supply chain for electronics with tier 3+ suppliers',
    nodes: 7,
    category: 'Industry',
    complexity: 'High',
    nodes_data: ELECTRONICS_TEMPLATE,
    edges_data: ELECTRONICS_TEMPLATE_EDGES,
    icon: '💻',
    features: ['Global reach', 'Tier 3+ suppliers', 'Air/Sea shipping']
  },
  {
    id: 'food-beverage',
    name: 'Food & Beverage Cold Chain',
    description: 'Temperature-controlled supply chain for perishables',
    nodes: FOOD_BEVERAGE_COLD_CHAIN_TEMPLATE.length,
    category: 'Industry',
    complexity: 'Medium',
    nodes_data: FOOD_BEVERAGE_COLD_CHAIN_TEMPLATE,
    edges_data: FOOD_BEVERAGE_COLD_CHAIN_TEMPLATE_EDGES,
    icon: '🥗',
    features: ['Cold chain', 'Temperature control', 'Fast transit']
  },
  {
    id: 'automotive-jit',
    name: 'Automotive Just-in-Time',
    description: 'Lean manufacturing with minimal inventory',
    nodes: AUTOMOTIVE_JIT_TEMPLATE.length,
    category: 'Industry',
    complexity: 'High',
    nodes_data: AUTOMOTIVE_JIT_TEMPLATE,
    edges_data: AUTOMOTIVE_JIT_TEMPLATE_EDGES,
    icon: '🚗',
    features: ['JIT delivery', 'Lean inventory', 'Regional suppliers']
  },
  {
    id: 'pharma-regulated',
    name: 'Pharmaceutical Regulated',
    description: 'Highly regulated supply chain with compliance requirements',
    nodes: PHARMA_REGULATED_TEMPLATE.length,
    category: 'Industry',
    complexity: 'High',
    nodes_data: PHARMA_REGULATED_TEMPLATE,
    edges_data: PHARMA_REGULATED_TEMPLATE_EDGES,
    icon: '💊',
    features: ['Regulatory compliance', 'Traceability', 'Quality control']
  },
  {
    id: 'energy-bulk',
    name: 'Energy & Bulk Commodities',
    description: 'Large-scale commodity transportation',
    nodes: ENERGY_BULK_TEMPLATE.length,
    category: 'Industry',
    complexity: 'Medium',
    nodes_data: ENERGY_BULK_TEMPLATE,
    edges_data: ENERGY_BULK_TEMPLATE_EDGES,
    icon: '⚡',
    features: ['Bulk transport', 'Infrastructure heavy', 'Long contracts']
  },
  {
    id: 'fashion-seasonal',
    name: 'Fashion & Seasonal',
    description: 'Fast fashion with seasonal demand patterns',
    nodes: FASHION_SEASONAL_TEMPLATE.length,
    category: 'Industry',
    complexity: 'Medium',
    nodes_data: FASHION_SEASONAL_TEMPLATE,
    edges_data: FASHION_SEASONAL_TEMPLATE_EDGES,
    icon: '👗',
    features: ['Seasonal demand', 'Fast fashion', 'Global sourcing']
  },
  {
    id: 'high-value-global',
    name: 'High-Value Global Network',
    description: 'Secure transport for high-value items',
    nodes: HIGH_VALUE_GLOBAL_TEMPLATE.length,
    category: 'Characteristics',
    complexity: 'High',
    nodes_data: HIGH_VALUE_GLOBAL_TEMPLATE,
    edges_data: HIGH_VALUE_GLOBAL_TEMPLATE_EDGES,
    icon: '💎',
    features: ['High security', 'Specialized transport', 'Insurance coverage']
  },
  {
    id: 'hazardous-materials',
    name: 'Hazardous Materials',
    description: 'Specialized handling for dangerous goods',
    nodes: HAZARDOUS_MATERIALS_TEMPLATE.length,
    category: 'Characteristics',
    complexity: 'High',
    nodes_data: HAZARDOUS_MATERIALS_TEMPLATE,
    edges_data: HAZARDOUS_MATERIALS_TEMPLATE_EDGES,
    icon: '☢️',
    features: ['Safety protocols', 'Specialized carriers', 'Regulatory compliance']
  },
  {
    id: 'domestic-regional',
    name: 'Domestic Regional',
    description: 'Regional supply chain within single country',
    nodes: DOMESTIC_REGIONAL_TEMPLATE.length,
    category: 'Geographic',
    complexity: 'Low',
    nodes_data: DOMESTIC_REGIONAL_TEMPLATE,
    edges_data: DOMESTIC_REGIONAL_TEMPLATE_EDGES,
    icon: '🏠',
    features: ['Local sourcing', 'Shorter transit', 'Single currency']
  },
  {
    id: 'global-network',
    name: 'Global Multi-Hub Network',
    description: 'Complex international supply network',
    nodes: GLOBAL_NETWORK_TEMPLATE.length,
    category: 'Geographic',
    complexity: 'High',
    nodes_data: GLOBAL_NETWORK_TEMPLATE,
    edges_data: GLOBAL_NETWORK_TEMPLATE_EDGES,
    icon: '🌍',
    features: ['Global reach', 'Multiple hubs', 'Cross-border trade']
  },
  {
    id: 'tier1-simple',
    name: 'Simple Linear Chain',
    description: 'Basic Tier 1 supplier relationship',
    nodes: TIER1_SIMPLE_TEMPLATE.length,
    category: 'Complexity',
    complexity: 'Low',
    nodes_data: TIER1_SIMPLE_TEMPLATE,
    edges_data: TIER1_SIMPLE_TEMPLATE_EDGES,
    icon: '📏',
    features: ['Linear flow', 'Direct suppliers', 'Simple structure']
  },
  {
    id: 'tier3-complex',
    name: 'Complex Multi-Tier Network',
    description: 'Deep supply chain with Tier 3+ suppliers',
    nodes: TIER3_COMPLEX_TEMPLATE.length,
    category: 'Complexity',
    complexity: 'High',
    nodes_data: TIER3_COMPLEX_TEMPLATE,
    edges_data: TIER3_COMPLEX_TEMPLATE_EDGES,
    icon: '🕸️',
    features: ['Multi-tier suppliers', 'Complex dependencies', 'Risk cascading']
  }
] as const;

// Re-export all templates for backward compatibility
export {
  // Industry-specific templates
  ELECTRONICS_TEMPLATE,
  ELECTRONICS_TEMPLATE_EDGES,
  FOOD_BEVERAGE_COLD_CHAIN_TEMPLATE,
  FOOD_BEVERAGE_COLD_CHAIN_TEMPLATE_EDGES,
  AUTOMOTIVE_JIT_TEMPLATE,
  AUTOMOTIVE_JIT_TEMPLATE_EDGES,
  PHARMA_REGULATED_TEMPLATE,
  PHARMA_REGULATED_TEMPLATE_EDGES,
  ENERGY_BULK_TEMPLATE,
  ENERGY_BULK_TEMPLATE_EDGES,
  FASHION_SEASONAL_TEMPLATE,
  FASHION_SEASONAL_TEMPLATE_EDGES,
  
  // Product characteristic-specific templates
  HIGH_VALUE_GLOBAL_TEMPLATE,
  HIGH_VALUE_GLOBAL_TEMPLATE_EDGES,
  HAZARDOUS_MATERIALS_TEMPLATE,
  HAZARDOUS_MATERIALS_TEMPLATE_EDGES,
  
  // Geographic & operational templates
  DOMESTIC_REGIONAL_TEMPLATE,
  DOMESTIC_REGIONAL_TEMPLATE_EDGES,
  GLOBAL_NETWORK_TEMPLATE,
  GLOBAL_NETWORK_TEMPLATE_EDGES,
  
  // Supplier tier-specific templates
  TIER1_SIMPLE_TEMPLATE,
  TIER1_SIMPLE_TEMPLATE_EDGES,
  TIER3_COMPLEX_TEMPLATE,
  TIER3_COMPLEX_TEMPLATE_EDGES,
  
  // Legacy templates
  INITIAL_NODES,
  INITIAL_EDGES
}; 

// Global choke points for maritime/land trade routes
export const GLOBAL_CHOKEPOINTS = [
  'Suez Canal',
  'Panama Canal',
  'Strait of Malacca',
  'Strait of Hormuz',
  'Strait of Gibraltar',
  'Bosphorus Strait',
  'Dover Strait',
  'Bab-el-Mandeb',
  'Cape of Good Hope',
  'Turkish Straits',
  'Khyber Pass',
  'Brenner Pass',
  'Gotthard Pass',
  'Mont Blanc Tunnel',
  'Channel Tunnel',
  'Singapore Strait'
];

// Dynamic edge property definitions focused on disruption, risk, and chokepoints
export const EDGE_PROPERTY_SPECS: {
  matcher: (src: any, tgt: any, mode: string, meta?: any) => boolean;
  fields: PropertySpec[];
}[] = [
  // Base user risk inputs for all edges
  {
    matcher: () => true,
    fields: [
      {
        key: 'avgDelayDays', 
        type: 'number',
        label: 'Avg. Historical Delay (days)', 
        optional: true,
        showInfoIcon: true,
        infoText: 'Typical delay experienced on this leg.',
        defaultValue: 0
      },
      {
        key: 'frequencyOfDisruptions',
        type: 'number',
        label: 'Disruptions per Year',
        optional: true,
        showInfoIcon: true,
        infoText: 'Approximate number of severe disruptions annually.',
        defaultValue: 0
      }
    ]
  },

  // Availability of rerouting options if disrupted
  {
    matcher: () => true,
    fields: [
      {
        key: 'hasAltRoute',
        type: 'boolean',
        label: 'Alternative Route Options',
        optional: true,
        showInfoIcon: true,
        infoText: 'Does this route have viable alternative paths?'
      },
      {
        key: 'altRouteDetails',
        type: 'textarea',
        label: 'Alternative Routes (comma separated)',
        optional: true,
        showInfoIcon: true,
        infoText: 'Describe the alternative routes available for this leg.',
        dependsOn: { key: 'hasAltRoute', value: true }
      }
    ]
  },

  // Key chokepoint or global trade corridor exposure 
  {
    matcher: () => true,
    fields: [
      {
        key: 'passesThroughChokepoint',
        type: 'boolean',
        label: 'Passes Through Global Chokepoint',
        optional: true,
        showInfoIcon: true,
        infoText: 'Does this route pass through any major global trade chokepoints?'
      },
      {
        key: 'chokepointNames',
        type: 'multiselect',
        label: 'Global Chokepoints',
        options: GLOBAL_CHOKEPOINTS,
        optional: true,
        showInfoIcon: true,
        infoText: 'Select all global chokepoints this route passes through.',
        placeholder: 'Select chokepoints...',
        dependsOn: { key: 'passesThroughChokepoint', value: true }
      }
    ]
  }
]; 