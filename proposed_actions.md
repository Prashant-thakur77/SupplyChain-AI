# Proposed Copilot Actions for Digital Twin

Based on the analysis of the `components/digital-twin` directory, here are some proposed actions that can be added to the Copilot to enhance user interaction and analytical capabilities.

---

## Node Management

### 1. Update Node Properties

*   **Action:** `updateNodeProperties`
*   **Description:** Update properties of a specific node on the canvas. The user can specify the node by its label or ID, and provide the properties to update as key-value pairs. This allows for fine-grained control over node configurations.
*   **Parameters:**
    *   `nodeId: string` (or `nodeLabel: string`)
    *   `properties: object` (e.g., `{ "label": "New Factory Name", "description": "Updated description", "riskScore": 0.6 }`)
*   **Rationale:** Provides a direct way to programmatically edit any attribute of a node, from its name to its risk profile.

### 2. Update Multiple Node Properties

*   **Action:** `updateMultipleNodeProperties`
*   **Description:** Update properties for multiple nodes at once based on a filter. This is useful for bulk-editing nodes, for example, increasing the risk score for all suppliers in a certain country.
*   **Parameters:**
    *   `filter: object` (e.g., `{ "type": "supplierNode", "country": "CN" }`)
    *   `properties: object` (e.g., `{ "riskScore": 0.8 }`)
*   **Rationale:** Enables efficient bulk updates, which is crucial for scenario analysis and managing large supply chains.

### 3. Find and Select Node

*   **Action:** `findAndSelectNode`
*   **Description:** Finds a node on the canvas by its label, type, or other properties and highlights it. This helps the user to quickly navigate to a specific node on a complex canvas.
*   **Parameters:**
    *   `query: string` (e.g., "the main factory", "supplier in Vietnam")
*   **Rationale:** Improves navigation and usability on large and complex canvases.

---

## Edge Management

### 1. Update Edge Properties

*   **Action:** `updateEdgeProperties`
*   **Description:** Update properties of a specific edge (connection). The user can specify the edge by its ID or by the source and target nodes, and provide the properties to update.
*   **Parameters:**
    *   `edgeId: string` (or `sourceNodeId: string`, `targetNodeId: string`)
    *   `properties: object` (e.g., `{ "mode": "air", "cost": 5000, "transitTime": 2 }`)
*   **Rationale:** Similar to `updateNodeProperties`, this allows for programmatic control over the connections in the supply chain.

### 2. Find Riskiest Connections

*   **Action:** `findRiskiestConnections`
*   **Description:** Identifies and highlights the connections (edges) with the highest risk. Risk can be determined by factors like transit time, cost, or specific risk properties like passing through a chokepoint.
*   **Parameters:**
    *   `topN: number` (e.g., find the top 5 riskiest connections)
*   **Rationale:** Helps users to quickly focus on the most vulnerable parts of their supply chain's logistics.

---

## Canvas and View Management

### 1. Highlight Nodes by Property

*   **Action:** `highlightNodesByProperty`
*   **Description:** Highlights all nodes that match certain criteria. For example, highlight all nodes in a specific country, or all nodes with a high risk score.
*   **Parameters:**
    *   `filter: object` (e.g., `{ "country": "USA" }` or `{ "riskScore": { "operator": ">", "value": 0.7 } }`)
*   **Rationale:** Provides powerful visual analysis capabilities, allowing users to see patterns and distributions of properties across their supply chain.

---

## Risk Analysis

### 1. Identify Single Points of Failure

*   **Action:** `identifySinglePointOfFailure`
*   **Description:** Analyzes the supply chain graph to identify nodes that are single points of failure. A single point of failure is a node whose removal would disconnect the graph or a significant part of it.
*   **Parameters:** None
*   **Rationale:** This is a critical risk analysis feature that provides immediate insight into the structural vulnerabilities of the supply chain.
