import { useCopilotAction } from "@copilotkit/react-core";
import { toast } from "sonner";
import { validateSupplyChain, getValidationSummary, ValidationIssue } from '@/lib/validation/supply-chain-validator';
import { ActionContext } from './types';

export const useValidationActions = ({ nodes, edges, panelId, props }: ActionContext) => {
  const { onValidateSupplyChain } = props;

  // Validate and analyze supply chain
  useCopilotAction({
    name: `validateAndAnalyzeSupplyChain_${panelId}`,
    description: "Perform comprehensive validation and analysis of the current supply chain",
    parameters: [],
    handler: () => {
      const issues = validateSupplyChain(nodes, edges);
      const summary = getValidationSummary(issues);
      
      const errorMessages = issues.filter(i => i.severity === 'error').map(i => i.message);
      const warningMessages = issues.filter(i => i.severity === 'warning').map(i => i.message);
      
      if (summary.errors === 0) {
        toast.success(`Validation passed! ${summary.warnings} warnings found. Supply chain is ready for simulation.`);
      } else {
        toast.error(`Validation failed! ${summary.errors} errors and ${summary.warnings} warnings found. Please fix errors before proceeding.`);
      }
      
      if (onValidateSupplyChain) {
        onValidateSupplyChain();
      }
      return "Successfully validated supply chain";
    }
  });

  // Generate recommendations based on analysis
  const generateRecommendations = (nodes: any[], edges: any[], validationIssues: ValidationIssue[]): string[] => {
    const recommendations: string[] = [];
    
    // Analyze node distribution
    const nodeTypes = nodes.map(n => n.data?.type || n.type);
    const hasSupplier = nodeTypes.some(t => t.includes('Supplier') || t.includes('supplier'));
    const hasFactory = nodeTypes.some(t => t.includes('Factory') || t.includes('factory'));
    const hasWarehouse = nodeTypes.some(t => t.includes('Warehouse') || t.includes('warehouse'));
    const hasRetailer = nodeTypes.some(t => t.includes('Retailer') || t.includes('retailer'));
    
    if (!hasSupplier) recommendations.push("Add supplier nodes to represent raw material sources");
    if (!hasFactory && !hasWarehouse) recommendations.push("Add manufacturing or storage capacity");
    if (!hasRetailer) recommendations.push("Add retail endpoints to complete the supply chain");
    
    // Analyze connectivity
    const orphanedNodes = nodes.filter(node => 
      !edges.some(edge => edge.source === node.id || edge.target === node.id)
    );
    if (orphanedNodes.length > 0) {
      recommendations.push(`Connect ${orphanedNodes.length} isolated nodes to the supply chain`);
    }
    
    // Analyze risk exposure
    const highRiskConnections = edges.filter(e => (e.data?.frequencyOfDisruptions || 0) > 2);
    if (highRiskConnections.length > 0) {
      recommendations.push("Consider alternative routes for high-risk connections");
    }
    
    // Analyze geographic distribution
    const countries = [...new Set(nodes.map(n => n.data?.country || n.data?.location?.country).filter(Boolean))];
    if (countries.length === 1) {
      recommendations.push("Consider geographic diversification to reduce country-specific risks");
    }
    
    // Critical validation issues
    const criticalErrors = validationIssues.filter(i => i.severity === 'error');
    if (criticalErrors.length > 0) {
      recommendations.push(`Fix ${criticalErrors.length} critical validation errors before simulation`);
    }
    
    return recommendations;
  };

  // Optimize supply chain structure
  useCopilotAction({
    name: `optimizeSupplyChainStructure_${panelId}`,
    description: "Provide optimization suggestions based on current supply chain analysis",
    parameters: [],
    handler: () => {
      const validationIssues = validateSupplyChain(nodes, edges);
      const recommendations = generateRecommendations(nodes, edges, validationIssues);
      const topRecommendations = recommendations.slice(0, 3);
      
      const message = topRecommendations.length > 0 
        ? `Top optimization suggestions: ${topRecommendations.join(', ')}`
        : 'Your supply chain structure looks optimized!';
        
      toast.success(message);
      return message;
    }
  });
}; 