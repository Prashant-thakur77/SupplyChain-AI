import { useCopilotAction } from "@copilotkit/react-core";
import { ActionContext } from '../types';

export const useWarehouseActions = ({ panelId, props }: Pick<ActionContext, 'panelId' | 'props'>) => {
  const { onAddNode } = props;

  useCopilotAction({
    name: `addWarehouseNode_${panelId}`,
    description: "Add a warehouse node to the supply chain canvas. Warehouses store and manage inventory distribution.",
    parameters: [
      {
        name: "label",
        type: "string", 
        description: "Display name/label for the warehouse (e.g., 'Regional Distribution Center', 'Amazon Fulfillment Center')",
        required: true
      },
      {
        name: "description",
        type: "string",
        description: "Detailed description of what this warehouse stores and distributes (e.g., 'Regional distribution center for consumer electronics')",
        required: true
      },
      {
        name: "address",
        type: "string",
        description: "Physical location/address (e.g., 'Memphis, TN, USA', 'Frankfurt, Germany'). Choose strategic logistics locations.",
        required: true
      },
      {
        name: "country",
        type: "string",
        description: "The 3-letter ISO 3166-1 alpha-3 code for the country (e.g., USA, DEU, GBR)",
        required: true
      },
      {
        name: "capacity",
        type: "number",
        description: "Storage capacity. Typical range for warehouses: 1500-3000 units",
        required: false
      },
      {
        name: "leadTime",
        type: "number",
        description: "Processing time in days. Typical range for warehouses: 2-5 days",
        required: false
      },
      {
        name: "riskScore",
        type: "number",
        description: "Risk assessment score between 0.1 and 0.9. Consider location security, automation level, and natural disaster risk.",
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
    handler: ({ label, description, address, capacity = 2250, leadTime = 3, riskScore = 0.2, latitude, longitude, country }) => {
      if (onAddNode) {
        const nodeData = {
          label,
          description,
          type: "warehouse",
          capacity,
          leadTime,
          riskScore,
          location: { lat: latitude, lng: longitude, country },
          address,
          nodeColor: "#F59E0B" // Orange color for warehouses
        };

        onAddNode("warehouse", label, nodeData);
        return `Successfully added warehouse node: ${label}`;
      }
      return "Failed to add warehouse node: onAddNode function not available";
    }
  });
}; 