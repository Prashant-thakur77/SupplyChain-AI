import { useCopilotAction } from "@copilotkit/react-core";
import { toast } from "sonner";
import { selectTemplate, getTemplateInfo, SupplyChainFormData } from '@/lib/template-selector';
import { ActionContext } from './types';

export const useTemplateActions = ({ panelId, props }: ActionContext) => {
  const { onAddMultipleNodes, onAddMultipleEdges, onLoadTemplate } = props;

  // Build industry specific supply chain
  useCopilotAction({
    name: `buildIndustrySpecificSupplyChain_${panelId}`,
    description: "Build a complete supply chain using intelligent template selection based on industry and characteristics",
    parameters: [
      {
        name: "industry",
        type: "string",
        description: "Industry type (Electronics & High Tech, Food & Beverage, Automotive & Transportation, Pharma & Life Sciences, Energy & Utilities, Apparel, Textiles & Fashion)",
        required: true
      },
      {
        name: "productCharacteristics",
        type: "string[]",
        description: "Product characteristics (high_value, hazardous, perishable, bulk, regulated)",
        required: false
      },
      {
        name: "operationsLocation",
        type: "string[]",
        description: "Geographic scope (domestic, regional, global)",
        required: false
      },
      {
        name: "supplierTiers",
        type: "string",
        description: "Supplier complexity (tier1, tier2, tier3plus)",
        required: false
      }
    ],
    handler: ({ industry, productCharacteristics = [], operationsLocation = ['regional'], supplierTiers = 'tier2' }) => {
      if (onAddMultipleNodes && onAddMultipleEdges) {
        // Create form data for template selection
        const formData: SupplyChainFormData = {
          industry,
          productCharacteristics,
          operationsLocation,
          supplierTiers,
          currency: 'USD',
          shippingMethods: ['road', 'sea'],
          annualVolumeType: 'units',
          annualVolumeValue: 100000,
          risks: []
        };
        
        const templateData = selectTemplate(formData);
        const templateInfo = getTemplateInfo(formData);
        
        console.log("Template Data from buildIndustrySpecificSupplyChain:", JSON.stringify(templateData, null, 2));
        
        onAddMultipleNodes(templateData.nodes);
        onAddMultipleEdges(templateData.edges);
        toast.success(`Built ${templateInfo.templateName} with ${templateData.nodes.length} nodes and ${templateData.edges.length} edges. Reason: ${templateInfo.reason}`);
        return `Successfully built ${templateInfo.templateName}`;
      }
      return "Failed to build template: add functions not available";
    }
  });

  // Load supply chain template
  useCopilotAction({
    name: `loadSupplyChainTemplate_${panelId}`,
    description: "Load a predefined supply chain template with enhanced mapping",
    parameters: [
      {
        name: "templateName",
        type: "string",
        description: "Name of template to load (automotive, electronics, food-beverage, pharma, fashion, energy, high-value, hazardous, domestic, global, tier1, tier3plus)",
        required: true
      }
    ],
    handler: ({ templateName }) => {
      if (onLoadTemplate) {
        const templateMap: Record<string, string> = {
          'automotive': 'industry-automotive',
          'electronics': 'industry-electronics', 
          'food-beverage': 'industry-food-beverage',
          'food': 'industry-food-beverage',
          'pharma': 'industry-pharma',
          'pharmaceutical': 'industry-pharma',
          'fashion': 'industry-fashion',
          'apparel': 'industry-fashion',
          'energy': 'industry-energy',
          'high-value': 'characteristics-high-value',
          'hazardous': 'characteristics-hazardous',
          'domestic': 'geographic-domestic',
          'global': 'geographic-global',
          'tier1': 'supplier-tiers-tier1',
          'tier3plus': 'supplier-tiers-tier3plus',
          'tier3': 'supplier-tiers-tier3plus'
        };

        const templateId = templateMap[templateName.toLowerCase()];
        if (templateId) {
          console.log("Loading template with name:", templateName, "and mapped ID:", templateId);
          onLoadTemplate(templateId);
          toast.success(`Loaded ${templateName} supply chain template successfully!`);
          return `Successfully loaded template: ${templateName}`;
        } else {
          const availableTemplates = Object.keys(templateMap).join(', ');
          toast.error(`Template "${templateName}" not found. Available templates: ${availableTemplates}`);
          return `Template not found: ${templateName}`;
        }
      }
      return "Failed to load template: onLoadTemplate not available";
    }
  });

  // Build custom supply chain from complete prompt
  useCopilotAction({
    name: `buildCustomSupplyChain_${panelId}`,
    description: "Build a custom, interconnected supply chain abstract graph from scratch by generating both nodes and their connecting edges simultaneously. Use this when the user asks to 'create a digital twin' or 'build a supply chain' for a specific, bespoke, or non-template industry.",
    parameters: [
      {
        name: "nodes",
        type: "object[]",
        description: "Array of node objects. Each node must have an 'id' (string), 'type' (string: 'supplier', 'factory', 'warehouse', 'retailer', 'customer', 'distributor', '3pl', 'port', 'manufacturer', 'customNode'), 'label' (string), 'description' (string), 'country' (string), 'latitude' (number), and 'longitude' (number).",
        required: true
      },
      {
        name: "edges",
        type: "object[]",
        description: "Array of edge objects connecting the nodes. Each edge must have a 'source' (matching a node id), 'target' (matching a node id), 'mode' (string: 'road', 'sea', 'air', 'rail', 'pipeline'), 'cost' (number), 'transitTime' (number in days).",
        required: true
      }
    ],
    handler: ({ nodes: customNodes, edges: customEdges }) => {
      if (onAddMultipleNodes && onAddMultipleEdges) {
        // Validation and transformation
        const formattedNodes = customNodes.map((n: any, index: number) => ({
          id: n.id,
          type: ['supplier', 'factory', 'warehouse', 'retailer', 'customer', 'distributor', '3pl', 'port', 'manufacturer'].includes(n.type) ? n.type : 'customNode',
          position: { x: (index % 4) * 250 + 100, y: Math.floor(index / 4) * 200 + 100 },
          data: {
            label: n.label || `Node ${index + 1}`,
            description: n.description || '',
            type: n.type,
            location: {
              lat: n.latitude || 0,
              lng: n.longitude || 0,
              country: n.country || 'USA'
            },
            address: n.country || '',
            capacity: 1000,
            leadTime: 7,
            riskScore: 0.3
          }
        }));

        const formattedEdges = customEdges.map((e: any, index: number) => ({
          id: `edge-${e.source}-${e.target}-${index}`,
          source: e.source,
          target: e.target,
          type: 'customEdge',
          data: {
            mode: e.mode || 'road',
            cost: e.cost || 500,
            transitTime: e.transitTime || 5,
            riskMultiplier: 1.0,
            avgDelayDays: 1,
            frequencyOfDisruptions: 1,
            label: `${e.mode} route`
          }
        }));

        onAddMultipleNodes(formattedNodes);
        onAddMultipleEdges(formattedEdges);
        
        toast.success(`Generated custom supply chain with ${formattedNodes.length} nodes and ${formattedEdges.length} connections.`);
        return `Successfully generated custom supply chain with ${formattedNodes.length} nodes and ${formattedEdges.length} edges`;
      }
      return "Failed: Add multiple functions not available";
    }
  });
}; 