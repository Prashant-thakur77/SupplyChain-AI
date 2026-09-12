// Industry-specific templates
export { ELECTRONICS_TEMPLATE } from './industry/electronics/nodes';
export { ELECTRONICS_TEMPLATE_EDGES } from './industry/electronics/edges';

export { FOOD_BEVERAGE_COLD_CHAIN_TEMPLATE } from './industry/food-beverage/nodes';
export { FOOD_BEVERAGE_COLD_CHAIN_TEMPLATE_EDGES } from './industry/food-beverage/edges';

export { AUTOMOTIVE_JIT_TEMPLATE } from './industry/automotive/nodes';
export { AUTOMOTIVE_JIT_TEMPLATE_EDGES } from './industry/automotive/edges';

export { PHARMA_REGULATED_TEMPLATE } from './industry/pharma/nodes';
export { PHARMA_REGULATED_TEMPLATE_EDGES } from './industry/pharma/edges';

export { ENERGY_BULK_TEMPLATE } from './industry/energy/nodes';
export { ENERGY_BULK_TEMPLATE_EDGES } from './industry/energy/edges';

export { FASHION_SEASONAL_TEMPLATE } from './industry/fashion/nodes';
export { FASHION_SEASONAL_TEMPLATE_EDGES } from './industry/fashion/edges';

// Product characteristic-specific templates
export { HIGH_VALUE_GLOBAL_TEMPLATE } from './characteristics/high-value/nodes';
export { HIGH_VALUE_GLOBAL_TEMPLATE_EDGES } from './characteristics/high-value/edges';

export { HAZARDOUS_MATERIALS_TEMPLATE } from './characteristics/hazardous/nodes';
export { HAZARDOUS_MATERIALS_TEMPLATE_EDGES } from './characteristics/hazardous/edges';

// Geographic & operational templates
export { DOMESTIC_REGIONAL_TEMPLATE } from './geographic/domestic/nodes';
export { DOMESTIC_REGIONAL_TEMPLATE_EDGES } from './geographic/domestic/edges';

export { GLOBAL_NETWORK_TEMPLATE } from './geographic/global/nodes';
export { GLOBAL_NETWORK_TEMPLATE_EDGES } from './geographic/global/edges';

// Supplier tier-specific templates
export { TIER1_SIMPLE_TEMPLATE } from './supplier-tiers/tier1/nodes';
export { TIER1_SIMPLE_TEMPLATE_EDGES } from './supplier-tiers/tier1/edges';

export { TIER3_COMPLEX_TEMPLATE } from './supplier-tiers/tier3plus/nodes';
export { TIER3_COMPLEX_TEMPLATE_EDGES } from './supplier-tiers/tier3plus/edges';

// Legacy templates
export { INITIAL_NODES } from './legacy/nodes';
export { INITIAL_EDGES } from './legacy/edges'; 

// constants/
// ├── templates/
// │   ├── index.ts                    # Main export file
// │   ├── industry/                   # Industry-specific templates
// │   │   ├── electronics/
// │   │   │   ├── nodes.ts           # Electronics template nodes
// │   │   │   └── edges.ts           # Electronics template edges
// │   │   ├── food-beverage/
// │   │   │   ├── nodes.ts           # Food & beverage cold chain nodes
// │   │   │   └── edges.ts           # Food & beverage cold chain edges
// │   │   ├── automotive/
// │   │   │   ├── nodes.ts           # Automotive JIT nodes
// │   │   │   └── edges.ts           # Automotive JIT edges
// │   │   ├── pharma/
// │   │   │   ├── nodes.ts           # Pharmaceutical regulated nodes
// │   │   │   └── edges.ts           # Pharmaceutical regulated edges
// │   │   ├── energy/
// │   │   │   ├── nodes.ts           # Energy bulk commodities nodes
// │   │   │   └── edges.ts           # Energy bulk commodities edges
// │   │   └── fashion/
// │   │       ├── nodes.ts           # Fashion seasonal nodes
// │   │       └── edges.ts           # Fashion seasonal edges
// │   ├── characteristics/            # Product characteristic templates
// │   │   ├── high-value/
// │   │   │   ├── nodes.ts           # High-value global nodes
// │   │   │   └── edges.ts           # High-value global edges
// │   │   └── hazardous/
// │   │       ├── nodes.ts           # Hazardous materials nodes
// │   │       └── edges.ts           # Hazardous materials edges
// │   ├── geographic/                 # Geographic operation templates
// │   │   ├── domestic/
// │   │   │   ├── nodes.ts           # Domestic regional nodes
// │   │   │   └── edges.ts           # Domestic regional edges
// │   │   └── global/
// │   │       ├── nodes.ts           # Global network nodes
// │   │       └── edges.ts           # Global network edges
// │   ├── supplier-tiers/             # Supplier tier complexity templates
// │   │   ├── tier1/
// │   │   │   ├── nodes.ts           # Tier 1 simple nodes
// │   │   │   └── edges.ts           # Tier 1 simple edges
// │   │   └── tier3plus/
// │   │       ├── nodes.ts           # Tier 3+ complex nodes
// │   │       └── edges.ts           # Tier 3+ complex edges
// │   └── legacy/                     # Backward compatibility
// │       ├── nodes.ts               # Legacy INITIAL_NODES
// │       └── edges.ts               # Legacy INITIAL_EDGES
// └── digital-twin.tsx               # Updated main file