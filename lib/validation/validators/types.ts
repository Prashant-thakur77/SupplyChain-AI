// Validation issue interface
export interface ValidationIssue {
  id: string; // Unique ID for the issue
  elementId: string; // ID of the node or edge with the issue
  elementType: 'node' | 'edge' | 'graph';
  severity: 'error' | 'warning';
  message: string; // User-friendly error message
  suggestion: string; // Actionable advice on how to fix it
} 