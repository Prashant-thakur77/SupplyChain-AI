import { Node } from 'reactflow';
import { ValidationIssue } from './types';

// #region UTILITY FUNCTIONS
// Helper function to get country from node data (checking both possible locations)
function getNodeCountry(node: Node): string | undefined {
  return node.data.location?.country || node.data.country;
}

// Helper function to set country in the proper structure for consistency
function ensureCountryConsistency(node: Node): void {
  const country = getNodeCountry(node);
  if (country) {
    // Ensure both formats exist for backward compatibility
    if (!node.data.country) {
      node.data.country = country;
    }
    if (!node.data.location?.country) {
      if (!node.data.location) {
        node.data.location = {};
      }
      node.data.location.country = country;
    }
  }
}
// #endregion

// B. Node-Level Validation Functions
export function validateNode(node: Node): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  // Check for incomplete essential data
  issues.push(...validateNodeEssentialData(node));
  
  // Check for country information
  issues.push(...validateNodeCountry(node));
  
  // Check for invalid numeric values
  issues.push(...validateNodeNumericValues(node));
  
  // Check external company dependency validations
  issues.push(...validateExternalCompanyDependency(node));
  
  // Check supplier-specific validations
  if (node.data.type === 'Supplier') {
    issues.push(...validateSupplierNode(node));
  }
  
  // Check factory-specific validations
  if (node.data.type === 'Factory') {
    issues.push(...validateFactoryNode(node));
  }
  
  // Check warehouse-specific validations
  if (node.data.type === 'Warehouse') {
    issues.push(...validateWarehouseNode(node));
  }
  
  // Check distribution-specific validations
  if (node.data.type === 'Distribution') {
    issues.push(...validateDistributionNode(node));
  }
  
  // Check retailer-specific validations
  if (node.data.type === 'Retailer') {
    issues.push(...validateRetailerNode(node));
  }
  
  return issues;
}

function validateNodeEssentialData(node: Node): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const missingFields: string[] = [];
  
  // Check required fields
  if (!node.data.label || node.data.label.trim() === '') {
    missingFields.push('Label');
  }
  
  if (!node.data.type) {
    missingFields.push('Type');
  }
  
  // Check for country information - look in both possible locations
  const hasCountry = getNodeCountry(node);
  const hasAddress = node.data.address;
  
  if (!hasCountry && !hasAddress) {
    missingFields.push('Country or Address');
  }
  
  if (missingFields.length > 0) {
    issues.push({
      id: `incomplete-data-${node.id}`,
      elementId: node.id,
      elementType: 'node',
      severity: 'error',
      message: `Node '${node.data.label || node.id}' is missing required information: ${missingFields.join(', ')}.`,
      suggestion: 'Select the node and fill in all the required fields in the \'General\' and \'Location\' sections.'
    });
  }
  
  return issues;
}

function validateNodeNumericValues(node: Node): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  // Check risk score bounds
  if (node.data.riskScore !== undefined && (node.data.riskScore < 0 || node.data.riskScore > 1)) {
    issues.push({
      id: `invalid-risk-score-${node.id}`,
      elementId: node.id,
      elementType: 'node',
      severity: 'error',
      message: `Node '${node.data.label || node.id}' has an invalid risk score.`,
      suggestion: 'The risk score must be between 0 and 1.'
    });
  }
  
  // Mapping from field names to user-friendly names
  const fieldDisplayNames: Record<string, string> = {
    'productionCapacity': 'production capacity',
    'inventoryLevel': 'inventory level',
    'leadTime': 'lead time',
    'supplyCapacity': 'supply capacity',
    'minOrderQty': 'minimum order quantity',
    'cycleTime': 'cycle time',
    'utilizationPct': 'utilization percentage',
    'yieldRate': 'yield rate',
    'throughputCap': 'throughput capacity',
    'fleetSize': 'fleet size',
    'deliveryRangeKm': 'delivery range',
    'serviceLevelPct': 'service level percentage',
    'lastMileCap': 'last mile capacity',
    'annualThroughputTEU': 'annual throughput',
    'customsTimeDays': 'customs time',
    'berthCount': 'berth count',
    'congestionIndex': 'congestion index',
    'demandRate': 'demand rate',
    'shelfSpaceCap': 'shelf space capacity',
    'reorderPoint': 'reorder point'
  };
  
  // Check for negative values in capacity/quantity fields
  // Note: storageCapacity, storageCostPerUnit, and handlingCostPerUnit are handled specifically in node-type validations
  const numericFields = [
    'productionCapacity', 'inventoryLevel', 'leadTime',
    'supplyCapacity', 'minOrderQty', 'cycleTime', 'utilizationPct', 'yieldRate',
    'throughputCap', 'fleetSize',
    'deliveryRangeKm', 'serviceLevelPct', 'lastMileCap', 'annualThroughputTEU',
    'customsTimeDays', 'berthCount', 'congestionIndex', 'demandRate',
    'shelfSpaceCap', 'reorderPoint'
  ];
  
  for (const field of numericFields) {
    if (node.data[field] !== undefined && node.data[field] < 0) {
      const displayName = fieldDisplayNames[field] || field;
      issues.push({
        id: `negative-value-${node.id}-${field}`,
        elementId: node.id,
        elementType: 'node',
        severity: 'error',
        message: `Node '${node.data.label || node.id}' has a negative value for ${displayName}.`,
        suggestion: `The value for ${displayName} must be a positive number.`
      });
    }
  }
  
  return issues;
}

// External company dependency validation function
function validateExternalCompanyDependency(node: Node): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  // If node depends on external company, validate required fields
  if (node.data.dependsOnExternalCompany === true) {
    // Check if company name is provided
    if (!node.data.externalCompanyName || typeof node.data.externalCompanyName !== 'string' || node.data.externalCompanyName.trim() === '') {
      issues.push({
        id: `missing-external-company-name-${node.id}`,
        elementId: node.id,
        elementType: 'node',
        severity: 'error',
        message: `Node '${node.data.label || node.id}' depends on an external company but the company name is missing.`,
        suggestion: 'Enter the name of the external company in the node configuration, or disable the external company dependency.'
      });
    }
    
    // Check if company country is provided
    if (!node.data.externalCompanyCountry || typeof node.data.externalCompanyCountry !== 'string' || node.data.externalCompanyCountry.trim() === '') {
      issues.push({
        id: `missing-external-company-country-${node.id}`,
        elementId: node.id,
        elementType: 'node',
        severity: 'error',
        message: `Node '${node.data.label || node.id}' depends on an external company but the company's country of origin is missing.`,
        suggestion: 'Select the country of origin for the external company in the node configuration.'
      });
    }
    
    // Optional validation: warn if company name is too short (might be placeholder text)
    if (node.data.externalCompanyName && node.data.externalCompanyName.trim().length < 2) {
      issues.push({
        id: `short-external-company-name-${node.id}`,
        elementId: node.id,
        elementType: 'node',
        severity: 'warning',
        message: `Node '${node.data.label || node.id}' has a very short external company name.`,
        suggestion: 'Provide a more descriptive company name to better identify the external dependency.'
      });
    }
    
    // Optional validation: warn if description is missing (helps with context)
    if (!node.data.externalCompanyDescription || node.data.externalCompanyDescription.trim() === '') {
      issues.push({
        id: `missing-external-company-description-${node.id}`,
        elementId: node.id,
        elementType: 'node',
        severity: 'warning',
        message: `Node '${node.data.label || node.id}' depends on an external company but lacks a description.`,
        suggestion: 'Consider adding a description of the external company\'s role and relationship for better context.'
      });
    }
  }
  
  return issues;
}

// Supplier-specific validation function
function validateSupplierNode(node: Node): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  // 1. Check if supplierTier value is present
  if (!node.data.supplierTier) {
    issues.push({
      id: `missing-supplier-tier-${node.id}`,
      elementId: node.id,
      elementType: 'node',
      severity: 'error',
      message: `Supplier node '${node.data.label || node.id}' is missing supplier tier information.`,
      suggestion: 'Select the supplier tier (tier1, tier2, or tier3+) in the node configuration.'
    });
  }
  
  // 2. Check if supplyCapacity is greater than 0
  if (node.data.supplyCapacity !== undefined) {
    if (node.data.supplyCapacity <= 0) {
      issues.push({
        id: `invalid-supply-capacity-${node.id}`,
        elementId: node.id,
        elementType: 'node',
        severity: 'warning',
        message: `Supplier node '${node.data.label || node.id}' has zero or negative supply capacity.`,
        suggestion: 'Consider removing this node if it has no supply capacity, or update the capacity to a positive value.'
      });
    }
  } else {
    issues.push({
      id: `missing-supply-capacity-${node.id}`,
      elementId: node.id,
      elementType: 'node',
      severity: 'error',
      message: `Supplier node '${node.data.label || node.id}' is missing supply capacity information.`,
      suggestion: 'Enter the annual supply capacity for this supplier in the node configuration, must be greater than 0.'
    });
  }
  
  // 3. Check if materialType is present and has string value (mandatory field)
  if (!node.data.materialType || typeof node.data.materialType !== 'string' || node.data.materialType.trim() === '') {
    issues.push({
      id: `missing-material-type-${node.id}`,
      elementId: node.id,
      elementType: 'node',
      severity: 'error',
      message: `Supplier node '${node.data.label || node.id}' is missing material/component type information.`,
      suggestion: 'Specify the type of material or component this supplier provides.'
    });
  }
  
  // 4. Check if reliabilityPct is positive when present (optional field)
  if (node.data.reliabilityPct !== undefined) {
    if (typeof node.data.reliabilityPct !== 'number' || node.data.reliabilityPct < 0) {
      issues.push({
        id: `invalid-reliability-pct-${node.id}`,
        elementId: node.id,
        elementType: 'node',
        severity: 'error',
        message: `Supplier node '${node.data.label || node.id}' has an invalid reliability percentage.`,
        suggestion: 'The reliability percentage must be a positive number (0-100).'
      });
    }
    if (node.data.reliabilityPct > 100) {
      issues.push({
        id: `excessive-reliability-pct-${node.id}`,
        elementId: node.id,
        elementType: 'node',
        severity: 'warning',
        message: `Supplier node '${node.data.label || node.id}' has a reliability percentage greater than 100%.`,
        suggestion: 'Reliability percentage should typically be between 0-100%.'
      });
    }
  }
  
  return issues;
}

// Factory-specific validation function
function validateFactoryNode(node: Node): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  // 2. Check if cycleTime is present and must be greater than 0
  if (node.data.cycleTime === undefined) {
    issues.push({
      id: `missing-cycle-time-${node.id}`,
      elementId: node.id,
      elementType: 'node',
      severity: 'error',
      message: `Factory node '${node.data.label || node.id}' is missing cycle time information.`,
      suggestion: 'Enter the cycle time (days/unit) for this factory in the node configuration.'
    });
  } else if (typeof node.data.cycleTime !== 'number' || node.data.cycleTime <= 0) {
    issues.push({
      id: `invalid-cycle-time-${node.id}`,
      elementId: node.id,
      elementType: 'node',
      severity: 'error',
      message: `Factory node '${node.data.label || node.id}' has an invalid cycle time.`,
      suggestion: 'The cycle time must be a positive number greater than 0.'
    });
  }
  
  // 3. Check utilizationPct - must be present and should be positive
  if (node.data.utilizationPct === undefined) {
    issues.push({
      id: `missing-utilization-pct-${node.id}`,
      elementId: node.id,
      elementType: 'node',
      severity: 'error',
      message: `Factory node '${node.data.label || node.id}' is missing utilization percentage information.`,
      suggestion: 'Enter the average utilization percentage for this factory in the node configuration.'
    });
  } else if (typeof node.data.utilizationPct !== 'number' || node.data.utilizationPct <= 0) {
    issues.push({
      id: `invalid-utilization-pct-${node.id}`,
      elementId: node.id,
      elementType: 'node',
      severity: 'error',
      message: `Factory node '${node.data.label || node.id}' has an invalid utilization percentage.`,
      suggestion: 'The utilization percentage must be a positive number.'
    });
  } else if (node.data.utilizationPct > 100) {
    issues.push({
      id: `excessive-utilization-pct-${node.id}`,
      elementId: node.id,
      elementType: 'node',
      severity: 'warning',
      message: `Factory node '${node.data.label || node.id}' has a utilization percentage greater than 100%.`,
      suggestion: 'Utilization percentage should typically be between 0-100%. Values over 100% may indicate overutilization or incorrect data.'
    });
  }
  
  return issues;
}

// Warehouse-specific validation function
function validateWarehouseNode(node: Node): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  // 1. Check storageCapacity - custom handling for warehouses
  if (node.data.storageCapacity === undefined) {
    issues.push({
      id: `missing-storage-capacity-${node.id}`,
      elementId: node.id,
      elementType: 'node',
      severity: 'error',
      message: `Warehouse node '${node.data.label || node.id}' is missing storage capacity information.`,
      suggestion: 'Enter the total storage capacity for this warehouse in the node configuration.'
    });
  } else if (node.data.storageCapacity < 0) {
    issues.push({
      id: `negative-storage-capacity-${node.id}`,
      elementId: node.id,
      elementType: 'node',
      severity: 'error',
      message: `Warehouse node '${node.data.label || node.id}' has a negative storage capacity.`,
      suggestion: 'The storage capacity must be a positive number or zero.'
    });
  } else if (node.data.storageCapacity === 0) {
    issues.push({
      id: `zero-storage-capacity-${node.id}`,
      elementId: node.id,
      elementType: 'node',
      severity: 'warning',
      message: `Warehouse node '${node.data.label || node.id}' has zero storage capacity.`,
      suggestion: 'Consider removing this warehouse if it has no storage capacity, or update the capacity to a positive value.'
    });
  }
  
  // 2. Check storageCostPerUnit - if present, must be positive
  if (node.data.storageCostPerUnit !== undefined) {
    if (typeof node.data.storageCostPerUnit !== 'number' || node.data.storageCostPerUnit <= 0) {
      issues.push({
        id: `invalid-storage-cost-per-unit-${node.id}`,
        elementId: node.id,
        elementType: 'node',
        severity: 'error',
        message: `Warehouse node '${node.data.label || node.id}' has an invalid storage cost per unit.`,
        suggestion: 'The storage cost per unit must be a positive number.'
      });
    }
  }
  
  // 3. Check temperatureControl - must be present (true or false)
  if (typeof node.data.temperatureControl !== 'boolean') {
    issues.push({
      id: `missing-temperature-control-${node.id}`,
      elementId: node.id,
      elementType: 'node',
      severity: 'error',
      message: `Warehouse node '${node.data.label || node.id}' is missing temperature control information.`,
      suggestion: 'Specify whether this warehouse has temperature-controlled storage (true or false) in the node configuration.'
    });
  }
  
  // 4. Check handlingCostPerUnit - if present, must be greater than -1
  if (node.data.handlingCostPerUnit !== undefined) {
    if (typeof node.data.handlingCostPerUnit !== 'number' || node.data.handlingCostPerUnit <= -1) {
      issues.push({
        id: `invalid-handling-cost-per-unit-${node.id}`,
        elementId: node.id,
        elementType: 'node',
        severity: 'error',
        message: `Warehouse node '${node.data.label || node.id}' has an invalid handling cost per unit.`,
        suggestion: 'The handling cost per unit must be greater than -1.'
      });
    }
  }
  
  return issues;
}

// Distribution-specific validation function
function validateDistributionNode(node: Node): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  // 1. Check fleetSize - can be 0 (warning) but not negative (error)
  if (node.data.fleetSize !== undefined) {
    if (typeof node.data.fleetSize !== 'number' || node.data.fleetSize < 0) {
      issues.push({
        id: `negative-fleet-size-${node.id}`,
        elementId: node.id,
        elementType: 'node',
        severity: 'error',
        message: `Distribution node '${node.data.label || node.id}' has a negative fleet size.`,
        suggestion: 'The fleet size must be a positive number or zero.'
      });
    } else if (node.data.fleetSize === 0) {
      issues.push({
        id: `zero-fleet-size-${node.id}`,
        elementId: node.id,
        elementType: 'node',
        severity: 'warning',
        message: `Distribution node '${node.data.label || node.id}' has zero fleet size.`,
        suggestion: 'Consider removing this distribution node if it has no vehicles, or update the fleet size to a positive value.'
      });
    }
  }
  
  // 2. Check deliveryRangeKm - must be greater than 0
  if (node.data.deliveryRangeKm !== undefined) {
    if (typeof node.data.deliveryRangeKm !== 'number' || node.data.deliveryRangeKm <= 0) {
      issues.push({
        id: `invalid-delivery-range-${node.id}`,
        elementId: node.id,
        elementType: 'node',
        severity: 'error',
        message: `Distribution node '${node.data.label || node.id}' has an invalid delivery range.`,
        suggestion: 'The delivery range must be a positive number greater than 0.'
      });
    }
  }
  
  return issues;
}

// Retailer-specific validation function
function validateRetailerNode(node: Node): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  // 1. Check demandRate - must be present and non-negative
  if (node.data.demandRate === undefined) {
    issues.push({
      id: `missing-demand-rate-${node.id}`,
      elementId: node.id,
      elementType: 'node',
      severity: 'error',
      message: `Retailer node '${node.data.label || node.id}' is missing demand rate information.`,
      suggestion: 'Enter the average demand (units/day) for this retailer in the node configuration.'
    });
  } else if (typeof node.data.demandRate !== 'number' || node.data.demandRate < 0) {
    issues.push({
      id: `negative-demand-rate-${node.id}`,
      elementId: node.id,
      elementType: 'node',
      severity: 'error',
      message: `Retailer node '${node.data.label || node.id}' has a negative demand rate.`,
      suggestion: 'The demand rate must be a non-negative number (zero or positive).'
    });
  } else if (node.data.demandRate === 0) {
    issues.push({
      id: `zero-demand-rate-${node.id}`,
      elementId: node.id,
      elementType: 'node',
      severity: 'warning',
      message: `Retailer node '${node.data.label || node.id}' has zero demand rate.`,
      suggestion: 'Consider removing this retailer if it has no demand, or update the demand rate to a positive value.'
    });
  }
  
  return issues;
}

// Add a specific country validation function
function validateNodeCountry(node: Node): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  // Get country from either location structure or direct property
  const country = getNodeCountry(node);
  
  if (!country) {
    issues.push({
      id: `missing-country-${node.id}`,
      elementId: node.id,
      elementType: 'node',
      severity: 'error', // Changed to error since country is critical for supply chain analysis
      message: `Node '${node.data.label || node.id}' is missing country information.`,
      suggestion: 'Select a country in the Location section. Country information is required for accurate supply chain risk assessment, logistics planning, and regulatory compliance analysis.'
    });
  } else if (typeof country !== 'string' || country.trim() === '') {
    issues.push({
      id: `invalid-country-${node.id}`,
      elementId: node.id,
      elementType: 'node',
      severity: 'error',
      message: `Node '${node.data.label || node.id}' has invalid country information.`,
      suggestion: 'Please re-select a valid country from the dropdown in the Location section.'
    });
  } else {
    // Country is valid, ensure consistency across data structure
    ensureCountryConsistency(node);
  }
  
  return issues;
}   