# Digital Twin Copilot Actions Documentation

This documentation covers all available AI assistant actions for the Digital Twin Supply Chain canvas. All actions are dynamically generated with unique IDs to prevent conflicts and enable multi-panel usage.

## 📊 Context Available to All Actions

### Node Data Structure
- **nodes**: Array of supply chain nodes with complete configuration
- **id**: Unique node identifier
- **type**: Node type (supplierNode, factoryNode, warehouseNode, distributionNode, retailerNode, portNode)
- **label**: Display name
- **position**: Canvas coordinates
- **data**: Rich properties including capacity, risk scores, location, costs, etc.

### Edge Data Structure  
- **edges**: Array of supply chain connections
- **source/target**: Connected node IDs
- **data**: Transportation mode, costs, transit times, risk factors, alternative routes

### Validation Context
- **validationIssues**: Real-time validation errors and warnings
- **validationSummary**: Aggregated validation status and recommendations

---

## 🏗️ Node Management Actions

### `addSupplyChainNode`
**Description**: Add a single node to the supply chain canvas with proper type mapping

**Parameters**:
- `nodeType` (string, required): Type of node (supplier, manufacturer, factory, warehouse, distributor, distribution, retailer, customer, 3pl, port)
- `label` (string, required): Display name/label for the node

**Context**: Current nodes array, node type mappings

**Test Prompt**: `"Add a supplier node called Tesla Battery Supplier"`

---

### `updateNodeProperties`
**Description**: Update properties of a specific node on the canvas

**Parameters**:
- `nodeId` (string, optional): The ID of the node to update
- `nodeLabel` (string, optional): The label of the node to update
- `properties` (object, required): Properties to update

**Context**: Node ID/label lookup, current node properties

**Test Prompt**: `"Update the Tesla Battery Supplier to have a capacity of 10000 and risk score of 0.3"`

---

### `updateMultipleNodeProperties`
**Description**: Update properties for multiple nodes at once based on a filter

**Parameters**:
- `filter` (object, required): Filter to select nodes (e.g., {"type": "supplierNode", "data.country": "CN"})
- `properties` (object, required): Properties to update

**Context**: Node filtering logic, bulk update operations

**Test Prompt**: `"Update all supplier nodes in China to have a risk score of 0.8"`

---

### `findAndSelectNode`
**Description**: Finds and selects a node on the canvas by its label or type

**Parameters**:
- `query` (string, required): The label, type, or other property to search for

**Context**: Node search algorithms, selection highlighting

**Test Prompt**: `"Find and select the Tesla factory"`

---

### `deleteNode`
**Description**: Deletes a node from the canvas by its label or ID.

**Parameters**:
- `nodeId` (string, optional): The ID of the node to delete.
- `nodeLabel` (string, optional): The label of the node to delete.

**Context**: Node ID/label lookup, node deletion.

**Test Prompt**: `"Delete the node named 'Tesla Battery Supplier'"`

---

## 🔗 Edge Management Actions

### `updateEdgeProperties`
**Description**: Update properties of a specific connection/edge

**Parameters**:
- `edgeId` (string, optional): The ID of the edge
- `sourceNodeId` (string, optional): The ID of the source node
- `targetNodeId` (string, optional): The ID of the target node
- `properties` (object, required): Properties to update

**Context**: Edge ID lookup, connection properties

**Test Prompt**: `"Update the connection between Tesla factory and distribution center to have cost 5000 and transit time 3 days"`

---

## 🎨 Canvas & Layout Actions

### `clearCanvas`
**Description**: Clear all nodes and edges from the canvas

**Parameters**: None

**Context**: Canvas state management

**Test Prompt**: `"Clear the entire canvas"`

---

### `optimizeLayout`
**Description**: Automatically select and apply the best layout algorithm based on network characteristics

**Parameters**:
- `priority` (string, optional): Layout priority (clarity, performance, aesthetics)
- `preservePositions` (boolean, optional): Whether to preserve some existing positions

**Context**: Layout algorithm selection, network analysis

**Test Prompt**: `"Optimize the supply chain layout for clarity while preserving positions"`

---

## ✅ Validation & Analysis Actions

### `validateAndAnalyzeSupplyChain`
**Description**: Perform comprehensive validation and analysis of the current supply chain

**Parameters**: None

**Context**: Validation rules, error detection, connectivity analysis

**Test Prompt**: `"Validate my supply chain and check for any issues"`

---

### `optimizeSupplyChainStructure`
**Description**: Provide optimization suggestions based on current supply chain analysis

**Parameters**: None

**Context**: Optimization algorithms, best practice recommendations

**Test Prompt**: `"Analyze my supply chain and suggest improvements"`

---

## 🏭 Template Actions

### `buildIndustrySpecificSupplyChain`
**Description**: Build a complete supply chain using intelligent template selection

**Parameters**:
- `industry` (string, required): Industry type (Electronics & High Tech, Food & Beverage, Automotive & Transportation, etc.)
- `productCharacteristics` (string[], optional): Product characteristics (high_value, hazardous, perishable, bulk, regulated)
- `operationsLocation` (string[], optional): Geographic scope (domestic, regional, global)
- `supplierTiers` (string, optional): Supplier complexity (tier1, tier2, tier3plus)

**Context**: Industry templates, geographic patterns, tier configurations

**Test Prompt**: `"Build an automotive supply chain with global operations and tier 3+ suppliers"`

---

## 🌐 Search Actions

### `search_web` (if enabled)
**Description**: Search the web for information using Tavily API

**Parameters**:
- `query` (string, required): The search query to find information about

**Context**: Internet connectivity, search API, result formatting

**Test Prompt**: `"Search for information about lithium battery supply chain risks"`

---

## ⚠️ Risk Analysis Actions

### `identifySinglePointsOfFailure`
**Description**: Analyzes the supply chain to identify nodes that are single points of failure

**Parameters**: None

**Context**: Graph connectivity analysis, failure simulation

**Test Prompt**: `"Identify any single points of failure in my supply chain"`

---

## 🔬 Advanced Node Actions

### `createNodeGroup`
**Description**: Create a group of nodes for easier management and bulk operations

**Parameters**:
- `nodeIds` (string[], required): Array of node IDs to group together
- `groupName` (string, required): Name for the node group
- `groupProperties` (object, optional): Common properties to apply to all nodes in the group

**Context**: Node grouping logic, group property management

**Test Prompt**: `"Group all Chinese suppliers together as 'China Operations'"`

---

### `updateNodeGroup`
**Description**: Update properties for all nodes in a specific group

**Parameters**:
- `groupName` (string, required): Name of the group to update
- `properties` (object, required): Properties to apply to all nodes in the group

**Context**: Group management, bulk property updates

**Test Prompt**: `"Update all nodes in China Operations group to have risk score 0.7"`

---

### `dissolveNodeGroup`
**Description**: Remove grouping from a set of nodes while keeping the nodes themselves

**Parameters**:
- `groupName` (string, required): Name of the group to dissolve

**Context**: Group management, ungrouping operations

**Test Prompt**: `"Dissolve the China Operations group"`

---

### `selectNodesByGroup`
**Description**: Highlight and focus on all nodes belonging to a specific group

**Parameters**:
- `groupName` (string, required): Name of the group to select

**Context**: Group selection, visual highlighting

**Test Prompt**: `"Select and highlight all nodes in the China Operations group"`

---

### `analyzeNodeDependencies`
**Description**: Analyze and highlight upstream and downstream dependencies for a specific node

**Parameters**:
- `nodeId` (string, required): ID of the node to analyze
- `depth` (number, optional): How many levels deep to analyze (default: 2)

**Context**: Dependency graph traversal, BFS algorithms, network analysis

**Test Prompt**: `"Analyze the dependencies for Tesla Gigafactory with depth 3"`

---

### `findNodeClusters`
**Description**: Identify and highlight tightly connected groups of nodes

**Parameters**:
- `minClusterSize` (number, optional): Minimum number of nodes in a cluster (default: 3)
- `connectionThreshold` (number, optional): Minimum connections required between cluster nodes (default: 2)

**Context**: Clustering algorithms, connectivity thresholds

**Test Prompt**: `"Find node clusters with minimum 4 nodes and connection threshold 3"`

---

### `calculateNodeCentrality`
**Description**: Calculate and highlight the most critical nodes based on centrality measures

**Parameters**:
- `measureType` (string, optional): Type of centrality measure (degree, betweenness, closeness, all)
- `topN` (number, optional): Number of top nodes to highlight (default: 5)

**Context**: Graph analytics, centrality algorithms (degree, betweenness, closeness)

**Test Prompt**: `"Calculate centrality for all nodes and highlight the top 5 most critical ones"`

---

### `filterNodesByCriteria`
**Description**: Find and highlight nodes that match specific criteria or properties

**Parameters**:
- `criteria` (object, required): Filter criteria object (e.g., {type: 'supplier', country: 'China'})
- `operator` (string, optional): Logical operator for multiple criteria (AND, OR)

**Context**: Complex filtering logic, property matching

**Test Prompt**: `"Filter and highlight all nodes with type supplier and country China"`

---

## 🔗 Advanced Edge Actions

### `bulkUpdateEdges`
**Description**: Update properties for multiple edges at once based on filter criteria

**Parameters**:
- `filter` (object, required): Filter criteria for selecting edges
- `properties` (object, required): Properties to update for matching edges
- `operator` (string, optional): Logical operator for multiple filter criteria (AND, OR)

**Context**: Edge filtering, bulk operations

**Test Prompt**: `"Update all sea transport routes to have risk multiplier 1.5"`

---

### `analyzeRouteResilience`
**Description**: Analyze the resilience of transportation routes against disruptions

**Parameters**:
- `disruptionType` (string, optional): Type of disruption to analyze (weather, political, infrastructure, all)
- `severityLevel` (string, optional): Disruption severity level (low, medium, high)

**Context**: Route vulnerability analysis, disruption modeling

**Test Prompt**: `"Analyze route resilience for weather disruptions at high severity"`

---

### `optimizeMultiModalTransport`
**Description**: Suggest multi-modal transportation optimizations for better efficiency

**Parameters**:
- `distanceThreshold` (number, optional): Distance threshold for multi-modal consideration (km)
- `costThreshold` (number, optional): Cost threshold for optimization suggestions

**Context**: Transport mode analysis, cost optimization

**Test Prompt**: `"Optimize transport modes for routes over 1000km with cost threshold 2000"`

---

## 🛡️ Advanced Risk Actions

### `calculateComprehensiveRisk`
**Description**: Calculate comprehensive risk scores with configurable factors

**Parameters**:
- `riskFactors` (string[], optional): Risk factors to consider (geographic, operational, financial, political, environmental)
- `weightings` (object, optional): Weighting for each factor
- `threshold` (number, optional): Risk threshold for highlighting nodes (0-1)

**Context**: Multi-factor risk analysis, weighting systems

**Test Prompt**: `"Calculate comprehensive risk focusing on geographic and operational factors"`

---

### `suggestRiskMitigation`
**Description**: Provide specific risk mitigation strategies for identified vulnerabilities

**Parameters**:
- `riskType` (string, optional): Type of risk to focus on (geographic, operational, supply, demand, all)
- `maxSuggestions` (number, optional): Maximum number of suggestions to provide

**Context**: Risk mitigation database, strategy recommendations

**Test Prompt**: `"Suggest mitigation strategies for geographic risks with max 5 suggestions"`

---

### `simulateRiskScenario`
**Description**: Simulate various risk scenarios and their impact on the supply chain

**Parameters**:
- `scenarioType` (string, required): Type of scenario (node_failure, route_disruption, capacity_reduction, demand_spike)
- `intensity` (string, optional): Scenario intensity (low, medium, high)
- `duration` (number, optional): Scenario duration in days
- `targetId` (string, optional): Specific node or edge ID to target

**Context**: Scenario modeling, impact analysis, cascade effects

**Test Prompt**: `"Simulate a high-intensity node failure scenario for 14 days"`

---

## 🚀 Usage Guidelines

### Action Naming Convention
All actions use dynamic panel IDs (`${panelId}`) to prevent conflicts when multiple panels are active.

### Error Handling
- Actions include comprehensive error handling and user feedback
- Toast notifications provide immediate feedback on action results
- Input validation occurs before execution

### Context Awareness
- Actions leverage full supply chain context for intelligent operations
- Real-time validation data influences action behavior
- Graph analytics provide deep insights into network structure

### Performance Considerations
- Advanced actions include optimization for large networks (500+ nodes)
- Virtualization and level-of-detail rendering for complex visualizations
- Memory cleanup and garbage collection assistance

---

## 🧪 Testing Actions

### Individual Action Testing
Use the provided test prompts with the AI assistant. Each action is designed to:
- Provide immediate visual feedback
- Show toast notifications for results
- Validate inputs before execution
- Handle edge cases gracefully

### Complex Workflow Examples

#### Building and Analyzing a Supply Chain
```
1. "Build an automotive supply chain with global operations and tier 3+ suppliers"
2. "Find node clusters with minimum 4 nodes"
3. "Calculate comprehensive risk focusing on geographic factors"
4. "Suggest mitigation strategies for geographic risks"
```

#### Node Management Workflow
```
1. "Add a supplier node called Tesla Battery Supplier"
2. "Group all Chinese suppliers together as 'China Operations'"
3. "Update all nodes in China Operations group to have risk score 0.7"
4. "Analyze dependencies for the main factory with depth 3"
```

#### Risk Analysis Workflow
```
1. "Identify any single points of failure in my supply chain"
2. "Simulate a high-intensity node failure scenario for 7 days"
3. "Calculate node centrality and highlight top 5 critical nodes"
4. "Suggest risk mitigation strategies for operational risks"
```

---

## 📋 Action Categories Summary

| Category | Actions | Primary Use Cases |
|----------|---------|-------------------|
| **Node Management** | 5 actions | Adding, updating, finding, deleting nodes |
| **Edge Management** | 1 action | Connection configuration |
| **Canvas & Layout** | 2 actions | Visual organization, cleanup |
| **Validation** | 2 actions | Quality assurance, optimization |
| **Templates** | 1 action | Rapid prototyping |
| **Search** | 1 action | External information |
| **Risk Analysis** | 1 action | Basic vulnerability assessment |
| **Advanced Nodes** | 7 actions | Complex node operations |
| **Advanced Edges** | 3 actions | Route optimization, analysis |
| **Advanced Risk** | 3 actions | Comprehensive risk management |

**Total: 26 Actions** providing comprehensive supply chain digital twin management capabilities.

---

## 🧪 Complete Test Prompts Collection

### Node Management Actions
1. **addSupplyChainNode**: `"Add a supplier node called Tesla Battery Supplier"`
2. **updateNodeProperties**: `"Update the Tesla Battery Supplier to have a capacity of 10000 and risk score of 0.3"`
3. **updateMultipleNodeProperties**: `"Update all supplier nodes in China to have a risk score of 0.8"`
4. **findAndSelectNode**: `"Find and select the Tesla factory"`
5. **deleteNode**: `"Delete the node 'Tesla Battery Supplier'"`

### Edge Management Actions
6. **updateEdgeProperties**: `"Update the connection between Tesla factory and distribution center to have cost 5000 and transit time 3 days"`

### Canvas & Layout Actions
7. **clearCanvas**: `"Clear the entire canvas"`
8. **optimizeLayout**: `"Optimize the supply chain layout for clarity while preserving positions"`

### Validation & Analysis Actions
9. **validateAndAnalyzeSupplyChain**: `"Validate my supply chain and check for any issues"`
10. **optimizeSupplyChainStructure**: `"Analyze my supply chain and suggest improvements"`

### Template Actions
11. **buildIndustrySpecificSupplyChain**: `"Build an automotive supply chain with global operations and tier 3+ suppliers"`

### Search Actions
12. **search_web**: `"Search for information about lithium battery supply chain risks"`

### Risk Analysis Actions
13. **identifySinglePointsOfFailure**: `"Identify any single points of failure in my supply chain"`

### Advanced Node Actions
14. **createNodeGroup**: `"Group all Chinese suppliers together as 'China Operations'"`
15. **updateNodeGroup**: `"Update all nodes in China Operations group to have risk score 0.7"`
16. **dissolveNodeGroup**: `"Dissolve the China Operations group"`
17. **selectNodesByGroup**: `"Select and highlight all nodes in the China Operations group"`
18. **analyzeNodeDependencies**: `"Analyze the dependencies for Tesla Gigafactory with depth 3"`
19. **findNodeClusters**: `"Find node clusters with minimum 4 nodes and connection threshold 3"`
20. **calculateNodeCentrality**: `"Calculate centrality for all nodes and highlight the top 5 most critical ones"`
21. **filterNodesByCriteria**: `"Filter and highlight all nodes with type supplier and country China"`

### Advanced Edge Actions
22. **bulkUpdateEdges**: `"Update all sea transport routes to have risk multiplier 1.5"`
23. **analyzeRouteResilience**: `"Analyze route resilience for weather disruptions at high severity"`
24. **optimizeMultiModalTransport**: `"Optimize transport modes for routes over 1000km with cost threshold 2000"`

### Advanced Risk Actions
25. **calculateComprehensiveRisk**: `"Calculate comprehensive risk focusing on geographic and operational factors"`
26. **suggestRiskMitigation**: `"Suggest mitigation strategies for geographic risks with max 5 suggestions"`
27. **simulateRiskScenario**: `"Simulate a high-intensity node failure scenario for 14 days"`

---

## 📝 Quick Reference for Testing

### Copy-Paste Ready Commands
```
Add a supplier node called Tesla Battery Supplier
Update the Tesla Battery Supplier to have a capacity of 10000 and risk score of 0.3
Update all supplier nodes in China to have a risk score of 0.8
Find and select the Tesla factory
Delete the node 'Tesla Battery Supplier'
Update the connection between Tesla factory and distribution center to have cost 5000 and transit time 3 days
Clear the entire canvas
Optimize the supply chain layout for clarity while preserving positions
Validate my supply chain and check for any issues
Analyze my supply chain and suggest improvements
Build an automotive supply chain with global operations and tier 3+ suppliers
Search for information about lithium battery supply chain risks
Identify any single points of failure in my supply chain
Group all Chinese suppliers together as 'China Operations'
Update all nodes in China Operations group to have risk score 0.7
Dissolve the China Operations group
Select and highlight all nodes in the China Operations group
Analyze the dependencies for Tesla Gigafactory with depth 3
Find node clusters with minimum 4 nodes and connection threshold 3
Calculate centrality for all nodes and highlight the top 5 most critical ones
Filter and highlight all nodes with type supplier and country China
Update all sea transport routes to have risk multiplier 1.5
Analyze route resilience for weather disruptions at high severity
Optimize transport modes for routes over 1000km with cost threshold 2000
Calculate comprehensive risk focusing on geographic and operational factors
Suggest mitigation strategies for geographic risks with max 5 suggestions
Simulate a high-intensity node failure scenario for 14 days
``` 