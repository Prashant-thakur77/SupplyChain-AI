import { Node } from 'reactflow';
import { ValidationIssue } from './types';

// Utility function to get validation summary
export function getValidationSummary(issues: ValidationIssue[]): { 
  errors: number; 
  warnings: number; 
  canSave: boolean;
  errorsByType: Record<string, number>;
  warningsByType: Record<string, number>;
} {
  const errors = issues.filter(issue => issue.severity === 'error');
  const warnings = issues.filter(issue => issue.severity === 'warning');
  
  const errorsByType = errors.reduce((acc, issue) => {
    acc[issue.elementType] = (acc[issue.elementType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const warningsByType = warnings.reduce((acc, issue) => {
    acc[issue.elementType] = (acc[issue.elementType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return {
    errors: errors.length,
    warnings: warnings.length,
    canSave: errors.length === 0,
    errorsByType,
    warningsByType
  };
}

// Helper function to get country from node data (checking both possible locations)
export function getNodeCountry(node: Node): string | undefined {
  return node.data.location?.country || node.data.country;
}

// Helper function to set country in the proper structure for consistency
export function ensureCountryConsistency(node: Node): void {
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