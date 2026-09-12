import { useCopilotAction } from "@copilotkit/react-core";
import { ActionContext } from '../types';

export const useCustomerActions = ({ panelId, props }: Pick<ActionContext, 'panelId' | 'props'>) => {
  const { onAddNode } = props;

  useCopilotAction({
    name: `addCustomerNode_${panelId}`,
    description: "Add a customer node to the supply chain canvas. Customers are the end consumers or businesses that purchase products.",
    parameters: [
      {
        name: "label",
        type: "string", 
        description: "Display name/label for the customer (e.g., 'Enterprise Customer', 'Consumer Market', 'B2B Client')",
        required: true
      },
      {
        name: "description",
        type: "string",
        description: "Detailed description of customer type and requirements (e.g., 'Large enterprise customer requiring bulk electronics procurement')",
        required: true
      },
      {
        name: "address",
        type: "string",
        description: "Physical location/address (e.g., 'San Francisco, CA, USA', 'London, UK'). Choose major market locations.",
        required: true
      },
      {
        name: "country",
        type: "string",
        description: "The 3-letter ISO 3166-1 alpha-3 code for the country (e.g., USA, GBR, CAN)",
        required: true
      },
      {
        name: "capacity",
        type: "number",
        description: "Demand capacity. Typical range for customers: 100-300 units",
        required: false
      },
      {
        name: "leadTime",
        type: "number",
        description: "Order processing time in days. Typical range for customers: 0-2 days",
        required: false
      },
      {
        name: "riskScore",
        type: "number",
        description: "Risk assessment score between 0.1 and 0.9. Consider payment reliability and demand stability.",
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
    handler: ({ label, description, address, capacity = 200, leadTime = 1, riskScore = 0.2, latitude, longitude, country }) => {
      if (onAddNode) {
        const nodeData = {
          label,
          description,
          type: "customer",
          capacity,
          leadTime,
          riskScore,
          location: { lat: latitude, lng: longitude, country },
          address,
          nodeColor: "#06B6D4" // Cyan color for customers
        };

        onAddNode("customer", label, nodeData);
        return `Successfully added customer node: ${label}`;
      }
      return "Failed to add customer node: onAddNode function not available";
    }
  });
}; 