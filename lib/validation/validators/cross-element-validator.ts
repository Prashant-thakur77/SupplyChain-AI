import { Node, Edge } from 'reactflow';
import { ValidationIssue } from './types';

// D. Cross-Element Validation Functions
export function validateSupplyChainFlow(nodes: Node[], edges: Edge[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  // Check for illogical supply chain flow
  for (const edge of edges) {
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);
    
    if (sourceNode && targetNode) {
      const sourceType = sourceNode.data.type;
      const targetType = targetNode.data.type;
      
      // Check for unconventional connections
      if (isUnconventionalConnection(sourceType, targetType)) {
        issues.push({
          id: `unconventional-flow-${edge.id}`,
          elementId: edge.id,
          elementType: 'edge',
          severity: 'warning',
          message: `An unconventional connection exists from a '${sourceType}' to a '${targetType}'.`,
          suggestion: 'Verify that the direction of this connection is correct. Typically, goods flow from suppliers to retailers.'
        });
      }
    }
  }
  
  return issues;
}

function isUnconventionalConnection(sourceType: string, targetType: string): boolean {
  // Define unconventional flows (these might be intentional but worth flagging)
  const unconventionalFlows = [
    ['Retailer', 'Manufacturer'],
    ['Retailer', 'Factory'],
    ['Retailer', 'Supplier'],
    ['Manufacturer', 'Supplier'],
    ['Factory', 'Supplier'],
    ['Distribution', 'Factory'],
    ['Distribution', 'Manufacturer']
  ];
  
  return unconventionalFlows.some(([source, target]) => 
    sourceType === source && targetType === target
  );
} 