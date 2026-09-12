import { useCopilotAction } from "@copilotkit/react-core";
import { ActionContext } from '../types';

export const useThirdPartyLogisticsActions = ({ panelId, props }: Pick<ActionContext, 'panelId' | 'props'>) => {
  const { onAddNode } = props;

  useCopilotAction({
    name: `add3PLNode_${panelId}`,
    description: "Add a 3PL (Third Party Logistics) node to the supply chain canvas. 3PLs provide logistics and supply chain management services.",
    parameters: [
      {
        name: "label",
        type: "string", 
        description: "Display name/label for the 3PL provider (e.g., 'FedEx Logistics', 'DHL Supply Chain', 'UPS Logistics')",
        required: true
      },
      {
        name: "description",
        type: "string",
        description: "Detailed description of logistics services (e.g., 'Comprehensive logistics provider offering warehousing, transportation, and distribution services')",
        required: true
      },
      {
        name: "address",
        type: "string",
        description: "Physical location/address (e.g., 'Memphis, TN, USA', 'Cologne, Germany'). Choose major logistics hubs.",
        required: true
      },
      {
        name: "country",
        type: "string",
        description: "The 3-letter ISO 3166-1 alpha-3 code for the country (e.g., USA, DEU, NLD)",
        required: true
      },
      {
        name: "capacity",
        type: "number",
        description: "Logistics capacity. Typical range for 3PLs: 1000-2500 units",
        required: false
      },
      {
        name: "leadTime",
        type: "number",
        description: "Service processing time in days. Typical range for 3PLs: 2-6 days",
        required: false
      },
      {
        name: "riskScore",
        type: "number",
        description: "Risk assessment score between 0.1 and 0.9. Consider service reliability and network complexity.",
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
    handler: ({ label, description, address, capacity = 1750, leadTime = 4, riskScore = 0.3, latitude, longitude, country }) => {
      if (onAddNode) {
        const nodeData = {
          label,
          description,
          type: "3pl",
          capacity,
          leadTime,
          riskScore,
          location: { lat: latitude, lng: longitude, country },
          address,
          nodeColor: "#84CC16" // Lime color for 3PLs
        };

        onAddNode("3pl", label, nodeData);
        return `Successfully added 3pl node: ${label}`;
      }
      return "Failed to add 3pl node: onAddNode function not available";
    }
  });
}; 