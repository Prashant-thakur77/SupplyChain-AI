import { Node, Edge } from 'reactflow';
import { ValidationIssue } from './types';

// #region UTILITY FUNCTIONS
// Helper function to get country from node data (checking both possible locations)
function getNodeCountry(node: Node): string | undefined {
  return node.data.location?.country || node.data.country;
}
// #endregion

// C. Edge-Level Validation Functions
export function validateEdge(edge: Edge, sourceNode?: Node, targetNode?: Node): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  // Check for incomplete connection data
  issues.push(...validateEdgeEssentialData(edge, sourceNode, targetNode));
  
  // Check for logical transport mode issues
  issues.push(...validateTransportMode(edge, sourceNode, targetNode));
  
  // Check for risk and disruption field validations
  issues.push(...validateEdgeRiskFields(edge, sourceNode, targetNode));
  
  return issues;
}

function validateEdgeEssentialData(edge: Edge, sourceNode?: Node, targetNode?: Node): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const missingFields: string[] = [];
  
  if (!edge.data.cost || edge.data.cost <= 0) {
    missingFields.push('Cost');
  }
  
  if (!edge.data.transitTime || edge.data.transitTime <= 0) {
    missingFields.push('Transit Time');
  }
  
  if (missingFields.length > 0) {
    const sourceLabel = sourceNode?.data.label || edge.source;
    const targetLabel = targetNode?.data.label || edge.target;
    
    issues.push({
      id: `incomplete-edge-data-${edge.id}`,
      elementId: edge.id,
      elementType: 'edge',
      severity: 'error',
      message: `The connection between '${sourceLabel}' and '${targetLabel}' has missing or invalid data: ${missingFields.join(', ')}.`,
      suggestion: 'Select the edge and provide valid Cost and Transit Time values.'
    });
  }
  
  return issues;
}

function validateTransportMode(edge: Edge, sourceNode?: Node, targetNode?: Node): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  if (!sourceNode || !targetNode) return issues;
  
  // Get country from either location structure or direct property
  const sourceCountry = getNodeCountry(sourceNode);
  const targetCountry = getNodeCountry(targetNode);
  const mode = edge.data.mode;
  
  // Check for inefficient transport modes
  if (sourceCountry && targetCountry && sourceCountry === targetCountry) {
    if (mode === 'sea' || mode === 'air') {
      issues.push({
        id: `inefficient-transport-${edge.id}`,
        elementId: edge.id,
        elementType: 'edge',
        severity: 'warning',
        message: `The transport mode between '${sourceNode.data.label}' and '${targetNode.data.label}' might be inefficient for domestic connections.`,
        suggestion: 'Consider \'Road\' or \'Rail\' for domestic connections instead of \'Sea\' or \'Air\'.'
      });
    }
  }
  
  return issues;
}

function validateEdgeRiskFields(edge: Edge, sourceNode?: Node, targetNode?: Node): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  // Validate avgDelayDays - should be non-negative if present
  if (edge.data.avgDelayDays !== undefined) {
    if (typeof edge.data.avgDelayDays !== 'number' || edge.data.avgDelayDays < 0) {
      issues.push({
        id: `invalid-avg-delay-${edge.id}`,
        elementId: edge.id,
        elementType: 'edge',
        severity: 'error',
        message: `Average historical delay must be a non-negative number.`,
        suggestion: 'Enter a valid number of days (0 or greater) for the average delay.'
      });
    }
  }
  
  // Validate frequencyOfDisruptions - should be non-negative if present
  if (edge.data.frequencyOfDisruptions !== undefined) {
    if (typeof edge.data.frequencyOfDisruptions !== 'number' || edge.data.frequencyOfDisruptions < 0) {
      issues.push({
        id: `invalid-disruption-frequency-${edge.id}`,
        elementId: edge.id,
        elementType: 'edge',
        severity: 'error',
        message: `Disruption frequency must be a non-negative number.`,
        suggestion: 'Enter a valid number (0 or greater) for disruptions per year.'
      });
    }
  }
  
  // Validate alternative route details dependency
  if (edge.data.hasAltRoute === true) {
    if (!edge.data.altRouteDetails || typeof edge.data.altRouteDetails !== 'string' || edge.data.altRouteDetails.trim() === '') {
      issues.push({
        id: `missing-alt-route-details-${edge.id}`,
        elementId: edge.id,
        elementType: 'edge',
        severity: 'warning',
        message: `Alternative route options are enabled but no details provided.`,
        suggestion: 'Describe the alternative routes available, or disable alternative route options if none exist.'
      });
    }
  }
  
  // Validate chokepoint details dependency
  if (edge.data.passesThroughChokepoint === true) {
    if (!edge.data.chokepointNames || (Array.isArray(edge.data.chokepointNames) && edge.data.chokepointNames.length === 0)) {
      issues.push({
        id: `missing-chokepoint-names-${edge.id}`,
        elementId: edge.id,
        elementType: 'edge',
        severity: 'warning',
        message: `Route passes through chokepoints but none are specified.`,
        suggestion: 'Select the specific global chokepoints this route passes through, or disable chokepoint option if none apply.'
      });
    }
  }
  
  // Validate chokepoint names for international routes only
  if (edge.data.chokepointNames && Array.isArray(edge.data.chokepointNames) && edge.data.chokepointNames.length > 0) {
    // Get country from either location structure or direct property
    const sourceCountry = sourceNode ? getNodeCountry(sourceNode) : undefined;
    const targetCountry = targetNode ? getNodeCountry(targetNode) : undefined;
    
    if (sourceCountry && targetCountry && sourceCountry === targetCountry) {
      issues.push({
        id: `chokepoint-domestic-route-${edge.id}`,
        elementId: edge.id,
        elementType: 'edge',
        severity: 'warning',
        message: `Global chokepoints selected for a domestic route.`,
        suggestion: 'Global chokepoints typically apply to international routes. Verify if this is correct for a domestic connection.'
      });
    }
  }
  
  // Warn about high disruption frequency without alternative routes
  if (edge.data.frequencyOfDisruptions !== undefined && edge.data.frequencyOfDisruptions > 3) {
    if (edge.data.hasAltRoute !== true) {
      issues.push({
        id: `high-disruption-no-alt-${edge.id}`,
        elementId: edge.id,
        elementType: 'edge',
        severity: 'warning',
        message: `High disruption frequency (${edge.data.frequencyOfDisruptions}/year) without alternative routes.`,
        suggestion: 'Consider identifying alternative routes for this high-risk connection to improve supply chain resilience.'
      });
    }
  }
  
  // Warn about chokepoint exposure without alternative routes
  if (edge.data.passesThroughChokepoint === true && edge.data.hasAltRoute !== true) {
    issues.push({
      id: `chokepoint-no-alt-${edge.id}`,
      elementId: edge.id,
      elementType: 'edge',
      severity: 'warning',
      message: `Route passes through global chokepoints without alternative routes.`,
      suggestion: 'Consider identifying alternative routes to reduce dependency on chokepoints and improve supply chain resilience.'
    });
  }
  
  return issues;
} 