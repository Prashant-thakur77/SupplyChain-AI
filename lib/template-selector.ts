import { Node, Edge } from 'reactflow';
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
  
  // Legacy templates (fallback)
  INITIAL_NODES,
  INITIAL_EDGES
} from '@/constants/templates';

export interface SupplyChainFormData {
  industry: string;
  customIndustry?: string;
  productCharacteristics: string[];
  supplierTiers: string;
  operationsLocation: string[];
  country?: string;
  currency: string;
  shippingMethods: string[];
  annualVolumeType: 'units' | 'currency';
  annualVolumeValue: number;
  risks: string[];
}

export interface TemplateData {
  nodes: Node[];
  edges: Edge[];
}

/**
 * Selects the most appropriate supply chain template based on user form data.
 * Priority order: Industry > Product Characteristics > Geographic Operations > Supplier Tiers > Default
 */
export function selectTemplate(formData: SupplyChainFormData): TemplateData {
  const { 
    industry, 
    customIndustry,
    productCharacteristics, 
    supplierTiers, 
    operationsLocation, 
    shippingMethods,
    risks 
  } = formData;

  // Determine the effective industry (use customIndustry if industry is "Other")
  const effectiveIndustry = industry === 'Other' ? customIndustry : industry;

  // Priority 1: Industry-specific templates with product characteristics consideration
  if (effectiveIndustry === "Electronics & High Tech" || effectiveIndustry?.toLowerCase().includes('electronics')) {
    return { nodes: ELECTRONICS_TEMPLATE, edges: ELECTRONICS_TEMPLATE_EDGES };
  }
  
  if (effectiveIndustry === "Food & Beverage" || effectiveIndustry?.toLowerCase().includes('food')) {
    // Check for perishable characteristics
    if (productCharacteristics.some(char => char.toLowerCase().includes('perishable') || char.toLowerCase().includes('cold'))) {
      return { nodes: FOOD_BEVERAGE_COLD_CHAIN_TEMPLATE, edges: FOOD_BEVERAGE_COLD_CHAIN_TEMPLATE_EDGES };
    }
    return { nodes: FOOD_BEVERAGE_COLD_CHAIN_TEMPLATE, edges: FOOD_BEVERAGE_COLD_CHAIN_TEMPLATE_EDGES };
  }
  
  if (effectiveIndustry === "Automotive & Transportation" || effectiveIndustry?.toLowerCase().includes('automotive')) {
    return { nodes: AUTOMOTIVE_JIT_TEMPLATE, edges: AUTOMOTIVE_JIT_TEMPLATE_EDGES };
  }
  
  if (effectiveIndustry === "Pharma & Life Sciences" || effectiveIndustry?.toLowerCase().includes('pharma')) {
    return { nodes: PHARMA_REGULATED_TEMPLATE, edges: PHARMA_REGULATED_TEMPLATE_EDGES };
  }
  
  if (effectiveIndustry === "Energy & Utilities" || effectiveIndustry?.toLowerCase().includes('energy')) {
    return { nodes: ENERGY_BULK_TEMPLATE, edges: ENERGY_BULK_TEMPLATE_EDGES };
  }
  
  if (effectiveIndustry === "Apparel, Textiles & Fashion" || effectiveIndustry?.toLowerCase().includes('fashion')) {
    return { nodes: FASHION_SEASONAL_TEMPLATE, edges: FASHION_SEASONAL_TEMPLATE_EDGES };
  }

  // Priority 2: Product characteristic-specific templates
  if (productCharacteristics.some(char => char.toLowerCase().includes('high_value') || char.toLowerCase().includes('high value'))) {
    if (operationsLocation.length > 1 || operationsLocation.some(loc => loc.toLowerCase().includes('global'))) {
      return { nodes: HIGH_VALUE_GLOBAL_TEMPLATE, edges: HIGH_VALUE_GLOBAL_TEMPLATE_EDGES };
    }
  }
  
  if (productCharacteristics.some(char => char.toLowerCase().includes('hazardous') || char.toLowerCase().includes('dangerous'))) {
    return { nodes: HAZARDOUS_MATERIALS_TEMPLATE, edges: HAZARDOUS_MATERIALS_TEMPLATE_EDGES };
  }

  // Priority 3: Geographic and operational complexity
  if (operationsLocation.includes("domestic") && operationsLocation.length === 1) {
    return { nodes: DOMESTIC_REGIONAL_TEMPLATE, edges: DOMESTIC_REGIONAL_TEMPLATE_EDGES };
  }
  
  if (operationsLocation.length > 2 || operationsLocation.some(loc => loc.toLowerCase().includes('global'))) {
    return { nodes: GLOBAL_NETWORK_TEMPLATE, edges: GLOBAL_NETWORK_TEMPLATE_EDGES };
  }

  // Priority 4: Supplier tier complexity
  if (supplierTiers === "tier1" || supplierTiers.toLowerCase().includes('tier 1')) {
    return { nodes: TIER1_SIMPLE_TEMPLATE, edges: TIER1_SIMPLE_TEMPLATE_EDGES };
  }
  
  if (supplierTiers === "tier3plus" || supplierTiers.toLowerCase().includes('tier 3') || supplierTiers.toLowerCase().includes('complex')) {
    return { nodes: TIER3_COMPLEX_TEMPLATE, edges: TIER3_COMPLEX_TEMPLATE_EDGES };
  }

  // Default fallback - use legacy template
  return { nodes: INITIAL_NODES, edges: INITIAL_EDGES };
}

/**
 * Gets template metadata for debugging and logging purposes
 */
export function getTemplateInfo(formData: SupplyChainFormData): { templateName: string; reason: string } {
  const { 
    industry, 
    customIndustry,
    productCharacteristics, 
    supplierTiers, 
    operationsLocation 
  } = formData;

  const effectiveIndustry = industry === 'Other' ? customIndustry : industry;

  if (effectiveIndustry === "Electronics & High Tech" || effectiveIndustry?.toLowerCase().includes('electronics')) {
    return { templateName: 'Electronics Template', reason: 'Matched industry: Electronics' };
  }
  
  if (effectiveIndustry === "Food & Beverage" || effectiveIndustry?.toLowerCase().includes('food')) {
    return { templateName: 'Food & Beverage Cold Chain Template', reason: 'Matched industry: Food & Beverage' };
  }
  
  if (effectiveIndustry === "Automotive & Transportation" || effectiveIndustry?.toLowerCase().includes('automotive')) {
    return { templateName: 'Automotive JIT Template', reason: 'Matched industry: Automotive' };
  }
  
  if (effectiveIndustry === "Pharma & Life Sciences" || effectiveIndustry?.toLowerCase().includes('pharma')) {
    return { templateName: 'Pharma Regulated Template', reason: 'Matched industry: Pharmaceutical' };
  }
  
  if (effectiveIndustry === "Energy & Utilities" || effectiveIndustry?.toLowerCase().includes('energy')) {
    return { templateName: 'Energy Bulk Template', reason: 'Matched industry: Energy' };
  }
  
  if (effectiveIndustry === "Apparel, Textiles & Fashion" || effectiveIndustry?.toLowerCase().includes('fashion')) {
    return { templateName: 'Fashion Seasonal Template', reason: 'Matched industry: Fashion' };
  }

  if (productCharacteristics.some(char => char.toLowerCase().includes('high_value'))) {
    return { templateName: 'High Value Global Template', reason: 'Matched product characteristic: High Value' };
  }
  
  if (productCharacteristics.some(char => char.toLowerCase().includes('hazardous'))) {
    return { templateName: 'Hazardous Materials Template', reason: 'Matched product characteristic: Hazardous' };
  }

  if (operationsLocation.includes("domestic") && operationsLocation.length === 1) {
    return { templateName: 'Domestic Regional Template', reason: 'Matched geographic scope: Domestic only' };
  }
  
  if (operationsLocation.length > 2) {
    return { templateName: 'Global Network Template', reason: 'Matched geographic scope: Multi-regional' };
  }

  if (supplierTiers === "tier1") {
    return { templateName: 'Tier 1 Simple Template', reason: 'Matched supplier tier: Tier 1' };
  }
  
  if (supplierTiers === "tier3plus") {
    return { templateName: 'Tier 3+ Complex Template', reason: 'Matched supplier tier: Tier 3+' };
  }

  return { templateName: 'Legacy Default Template', reason: 'No specific match found, using fallback' };
} 