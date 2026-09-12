import { useCopilotAction } from "@copilotkit/react-core";
import { ActionContext } from '../types';

export const useDistributorActions = ({ panelId, props }: Pick<ActionContext, 'panelId' | 'props'>) => {
  const { onAddNode } = props;

  useCopilotAction({
    name: `addDistributorNode_${panelId}`,
    description: "Add a distributor node to the supply chain canvas. Distributors manage regional product distribution and logistics.",
    parameters: [
      {
        name: "label",
        type: "string", 
        description: "Display name/label for the distributor (e.g., 'Regional Electronics Distributor', 'Food & Beverage Distribution')",
        required: true
      },
      {
        name: "description",
        type: "string",
        description: "Detailed description of distribution services (e.g., 'Regional distributor specializing in electronics and tech products')",
        required: true
      },
      {
        name: "address",
        type: "string",
        description: "Physical location/address (e.g., 'Chicago, IL, USA', 'London, UK'). Choose major distribution hubs.",
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
        description: "Distribution capacity. Typical range for distributors: 800-1500 units",
        required: false
      },
      {
        name: "leadTime",
        type: "number",
        description: "Processing time in days. Typical range for distributors: 3-7 days",
        required: false
      },
      {
        name: "riskScore",
        type: "number",
        description: "Risk assessment score between 0.1 and 0.9. Consider logistics complexity and market dependence.",
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
    handler: ({ label, description, address, capacity = 1150, leadTime = 5, riskScore = 0.3, latitude, longitude, country }) => {
      if (onAddNode) {
        const nodeData = {
          label,
          description,
          type: "distributor",
          capacity,
          leadTime,
          riskScore,
          location: { lat: latitude, lng: longitude, country },
          address,
          nodeColor: "#10B981" // Green color for distributors
        };

        onAddNode("distributor", label, nodeData);
        return `Successfully added distributor node: ${label}`;
      }
      return "Failed to add distributor node: onAddNode function not available";
    }
  });
}; 