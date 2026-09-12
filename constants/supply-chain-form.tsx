
// single select options
export const INDUSTRIES = [
  { label: "Electronics & High Tech", value: "Electronics & High Tech" },
  { label: "Food & Beverage", value: "Food & Beverage" },
  { label: "Consumer Goods & Retail", value: "Consumer Goods & Retail" },
  { label: "Automotive & Transportation", value: "Automotive & Transportation" },
  { label: "Pharma & Life Sciences", value: "Pharma & Life Sciences" },
  { label: "Chemicals & Materials", value: "Chemicals & Materials" },
  { label: "Apparel, Textiles & Fashion", value: "Apparel, Textiles & Fashion" },
  { label: "Energy & Utilities", value: "Energy & Utilities" },
  { label: "Industrial Manufacturing", value: "Industrial Manufacturing" },
  { label: "Logistics & 3PL", value: "Logistics & 3PL" },
  { label: "Other", value: "Other" },
] as const;

// multi select options
export const PRODUCT_CHARACTERISTICS = [
  { label: "Perishable / Cold-chain", value: "perishable" },
  { label: "High-value / Low-volume", value: "high_value" },
  { label: "Bulk commodities", value: "bulk" },
  { label: "Regulated (FDA / customs)", value: "regulated" },
  { label: "Hazardous / DG", value: "hazardous" },
  { label: "Seasonal / Peak-driven", value: "seasonal" },
];

// single select options
export const SUPPLIER_TIERS = [
  { label: "Tier 1 only", value: "tier1" },
  { label: "Tier 1 + Tier 2", value: "tier1_2" },
  { label: "Three or more tiers", value: "tier3plus" },
] as const;

// multi select options
export const OPERATIONS_LOCATIONS = [
  { label: "Domestic only", value: "domestic", exclusive: true }, // when selected, the country field is required
  { label: "North America", value: "na" },
  { label: "Europe", value: "eu" },
  { label: "APAC", value: "apac" },
];

// multi select options
export const SHIPPING_METHODS = [
  { label: "Sea", value: "sea" },
  { label: "Air", value: "air" },
  { label: "Road", value: "road" },
  { label: "Rail", value: "rail" },
];

// multi select options
export const RISK_FACTORS = [
  { label: "Political/regulatory (sanctions, customs delays)", value: "political" },
  { label: "Weather/disaster (typhoons, floods)", value: "weather" },
  { label: "Carrier capacity (port congestion, equipment shortages)", value: "carrier" },
  { label: "Currency or commodity price swings", value: "financial" },
  { label: "Supplier concentration risk", value: "supplier_concentration" },
  { label: "Quality/compliance issues", value: "quality" },
  { label: "Cybersecurity threats", value: "cyber" },
  { label: "Labor strikes/disputes", value: "labor" },
];

// info text
export const SUPPLIER_TIER_INFO = {
  title: "Supplier Tiers Explained:",
  description: "Tiers represent how far a supplier is from your company:",
  tiers: [
    { level: "Tier 1:", description: "Direct suppliers you buy from" },
    { level: "Tier 2:", description: "Suppliers to your Tier 1 vendors" },
    { level: "Tier 3+:", description: "Raw material or sub-component providers further upstream" },
  ]
} as const;

// single select options
export const ANNUAL_VOLUME_TYPES = [
  { label: "Units", value: "units" },
  { label: "Currency", value: "currency" },
] as const;

// array of objects with name and fields
export const FORM_STEPS = [
  { 
    name: "Company & Products", 
    fields: ["industry", "customIndustry", "productCharacteristics", "supplierTiers", "operationsLocation"] 
  },
  { 
    name: "Business Operations", 
    fields: ["currency", "shippingMethods", "annualVolumeType", "annualVolumeValue"] 
  },
  { 
    name: "Risk Assessment", 
    fields: ["risks"] 
  },
] as const; 



// example object when selected domestic only
// {
//   "industry": "Logistics & 3PL",
//   "productCharacteristics": [
//       "perishable"
//   ],
//   "supplierTiers": "tier1",
//   "operationsLocation": [
//       "domestic"
//   ],
//   "country": "IND",
//   "currency": "ALL",
//   "shippingMethods": [
//       "air"
//   ],
//   "annualVolumeType": "units",
//   "annualVolumeValue": 100000,
//   "risks": [
//       "supplier_concentration"
//   ]
// }