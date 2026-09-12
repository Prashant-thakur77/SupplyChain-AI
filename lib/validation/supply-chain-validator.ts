import { Node, Edge } from 'reactflow';
import {
  validateGraphStructure,
  validateNode,
  validateEdge,
  validateSupplyChainFlow,
  getValidationSummary,
  ValidationIssue
} from './validators';

// Main validation function
export function validateSupplyChain(nodes: Node[], edges: Edge[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // A. Graph-Level Validation
  issues.push(...validateGraphStructure(nodes, edges));

  // B. Node-Level Validation
  for (const node of nodes) {
    issues.push(...validateNode(node));
  }

  // C. Edge-Level Validation
  for (const edge of edges) {
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);
    issues.push(...validateEdge(edge, sourceNode, targetNode));
  }

  // D. Cross-Element Validation
  issues.push(...validateSupplyChainFlow(nodes, edges));

  return issues;
}

// Re-export getValidationSummary
export { getValidationSummary };
export type { ValidationIssue }; 