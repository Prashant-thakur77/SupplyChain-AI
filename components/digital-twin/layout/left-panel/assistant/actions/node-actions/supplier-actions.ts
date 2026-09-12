import { useCopilotAction } from "@copilotkit/react-core";
import { ActionContext } from '../types';

export const useSupplierActions = ({ panelId, props }: Pick<ActionContext, 'panelId' | 'props'>) => {
  const { onAddNode } = props;

  useCopilotAction({
    name: `addSupplierNode_${panelId}`,
    description: "Add a supplier node to the supply chain canvas. Suppliers provide raw materials, components, or services to the supply chain.",
    parameters: [
      {
        name: "label",
        type: "string", 
        description: "Display name/label for the supplier (e.g., 'Steel Supplier Inc', 'Component Manufacturers Ltd')",
        required: true
      },
      {
        name: "description",
        type: "string",
        description: "Detailed description of what this supplier provides (e.g., 'Provides high-grade steel components for automotive manufacturing')",
        required: true
      },
      {
        name: "address",
        type: "string",
        description: "Physical location/address (e.g., 'Pittsburgh, PA, USA', 'Birmingham, UK'). Choose realistic industrial locations.",
        required: true
      },
      {
        name: "country",
        type: "string",
        description: "The 3-letter ISO 3166-1 alpha-3 code for the country (e.g., USA, GBR, CHN)",
        required: true
      },
      {
        name: "capacity",
        type: "number",
        description: "Production capacity. Typical range for suppliers: 1000-2000 units",
        required: false
      },
      {
        name: "leadTime",
        type: "number",
        description: "Lead time in days. Typical range for suppliers: 10-21 days",
        required: false
      },
      {
        name: "riskScore",
        type: "number",
        description: "Risk assessment score between 0.1 and 0.9. Consider supplier reliability, location stability, and market factors.",
        required: false
      },
      {
        name: "latitude",
        type: "number",
        description: "Latitude coordinate for the location. Should match the provided address.",
        required: true
      },
      {
        name: "longitude",
        type: "number",
        description: "Longitude coordinate for the location. Should match the provided address.",
        required: true
      }
    ],
    handler: ({ label, description, address, capacity = 1500, leadTime = 15, riskScore = 0.4, latitude, longitude, country }) => {
      if (onAddNode) {
        const nodeData = {
          label,
          description,
          type: "supplier",
          capacity,
          leadTime,
          riskScore,
          location: { lat: latitude, lng: longitude, country },
          address,
          nodeColor: "#3B82F6" // Blue color for suppliers
        };

        onAddNode("supplier", label, nodeData);
        return `Successfully added supplier node: ${label}`;
      }
      return "Failed to add supplier node: onAddNode function not available";
    }
  });
}; 