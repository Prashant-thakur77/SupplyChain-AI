import { useCopilotAction } from "@copilotkit/react-core";
import { ActionContext } from '../types';

export const useRetailerActions = ({ panelId, props }: Pick<ActionContext, 'panelId' | 'props'>) => {
  const { onAddNode } = props;

  useCopilotAction({
    name: `addRetailerNode_${panelId}`,
    description: "Add a retailer node to the supply chain canvas. Retailers sell products directly to end consumers.",
    parameters: [
      {
        name: "label",
        type: "string", 
        description: "Display name/label for the retailer (e.g., 'Best Buy Store', 'Local Electronics Shop', 'Walmart Supercenter')",
        required: true
      },
      {
        name: "description",
        type: "string",
        description: "Detailed description of retail operations (e.g., 'Electronics retail store serving local consumers')",
        required: true
      },
      {
        name: "address",
        type: "string",
        description: "Physical location/address (e.g., 'New York, NY, USA', 'Toronto, Canada'). Choose consumer market locations.",
        required: true
      },
      {
        name: "country",
        type: "string",
        description: "The 3-letter ISO 3166-1 alpha-3 code for the country (e.g., USA, CAN, GBR)",
        required: true
      },
      {
        name: "capacity",
        type: "number",
        description: "Sales capacity. Typical range for retailers: 200-500 units",
        required: false
      },
      {
        name: "leadTime",
        type: "number",
        description: "Order fulfillment time in days. Typical range for retailers: 1-3 days",
        required: false
      },
      {
        name: "riskScore",
        type: "number",
        description: "Risk assessment score between 0.1 and 0.9. Consider market competition and consumer demand volatility.",
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
    handler: ({ label, description, address, capacity = 350, leadTime = 2, riskScore = 0.4, latitude, longitude, country }) => {
      if (onAddNode) {
        const nodeData = {
          label,
          description,
          type: "retailer",
          capacity,
          leadTime,
          riskScore,
          location: { lat: latitude, lng: longitude, country },
          address,
          nodeColor: "#8B5CF6" // Purple color for retailers
        };

        onAddNode("retailer", label, nodeData);
        return `Successfully added retailer node: ${label}`;
      }
      return "Failed to add retailer node: onAddNode function not available";
    }
  });
}; 