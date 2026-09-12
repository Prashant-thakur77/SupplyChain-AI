# useCopilotActions Hook Documentation

## Overview

The `useCopilotActions` hook is a powerful React hook that integrates CopilotKit AI capabilities into the supply chain digital twin canvas. It provides intelligent actions that users can trigger through natural language commands to build, validate, and optimize supply chain networks.

> **Note**: The `applyLayout` action has been removed from the system. Layout management is now handled through other mechanisms.

## Architecture

### Core Dependencies
- **CopilotKit**: For AI-powered actions and readable data
- **React Flow**: For canvas nodes and edges management
- **Supply Chain Validator**: For validation and analysis
- **Template Selector**: For intelligent template selection
- **Sonner**: For user feedback via toasts

### Hook Interface

```typescript
interface UseCopilotActionsProps {
  nodes: Node[];
  edges: Edge[];
  onAddNode?: (nodeType: string) => void;
  onAddMultipleNodes?: (nodes: Partial<Node>[]) => void;
  onLoadTemplate?: (templateId: string) => void;
  onClearCanvas?: () => void;
  onValidateSupplyChain?: () => void;
  // Note: onApplyLayout has been removed
}
```

## CopilotReadable Data Sources

The hook provides three main data sources that the AI can read and understand:

### 1. Enhanced Nodes Data
- **Purpose**: Provides comprehensive information about all supply chain nodes
- **Content**: 
  - Node configurations (capacity, lead time, risk scores)
  - Location and address information
  - Type-specific properties (supplier tier, production capacity, etc.)
  - External dependencies
  - Validation status

### 2. Enhanced Edges Data
- **Purpose**: Provides detailed connection and transportation route information
- **Content**:
  - Transportation modes and costs
  - Risk multipliers and delay data
  - Alternative route information
  - Chokepoint analysis

### 3. Supply Chain Analysis
- **Purpose**: High-level analysis and recommendations
- **Content**:
  - Structural analysis (node/connection counts, coverage)
  - Validation summary
  - Optimization recommendations

## Available Actions

### 1. Add Supply Chain Node

**Action Name**: `addSupplyChainNode_{panelId}`

**Description**: Adds a single node to the supply chain canvas with intelligent type mapping.

**Parameters**:
- `nodeType` (string, required): Type of node to add
- `label` (string, required): Display name for the node

**Supported Node Types**:
- `supplier` → `supplierNode`
- `manufacturer/factory` → `factoryNode`
- `warehouse` → `warehouseNode`
- `distributor/distribution` → `distributionNode`
- `retailer/customer` → `retailerNode`
- `3pl` → `distributionNode`
- `port` → `portNode`

**How It Works**:
1. Maps user-friendly names to internal node types
2. Calls the `onAddNode` callback with the mapped type
3. Provides success feedback via toast notification

**Example Usage**:
```
"Add a supplier node called Raw Materials Supplier"
"Create a warehouse named Distribution Center"
```

### 2. Build Industry-Specific Supply Chain

**Action Name**: `buildIndustrySpecificSupplyChain_{panelId}`

**Description**: Builds a complete supply chain using intelligent template selection based on industry and product characteristics.

**Parameters**:
- `industry` (string, required): Industry type
- `productCharacteristics` (string[], optional): Product attributes
- `operationsLocation` (string[], optional): Geographic scope
- `supplierTiers` (string, optional): Supplier complexity level

**Supported Industries**:
- Electronics & High Tech
- Food & Beverage
- Automotive & Transportation
- Pharma & Life Sciences
- Energy & Utilities
- Apparel, Textiles & Fashion

**Product Characteristics**:
- `high_value`: High-value products requiring security
- `hazardous`: Hazardous materials requiring special handling
- `perishable`: Time-sensitive products
- `bulk`: Large volume products
- `regulated`: Heavily regulated products

**Geographic Scopes**:
- `domestic`: Within a single country
- `regional`: Across nearby countries
- `global`: Worldwide operations

**Supplier Tiers**:
- `tier1`: Direct suppliers only
- `tier2`: Direct and indirect suppliers
- `tier3plus`: Complex multi-tier networks

**How It Works**:
1. Creates a `SupplyChainFormData` object from parameters
2. Uses `selectTemplate()` to choose the best template
3. Extracts nodes from the selected template
4. Calls `onAddMultipleNodes` to populate the canvas
5. Provides detailed feedback about the template selection

**Example Usage**:
```
"Build an automotive supply chain with global operations"
"Create a pharmaceutical supply chain for regulated products"
```

### 3. Validate and Analyze Supply Chain

**Action Name**: `validateAndAnalyzeSupplyChain_{panelId}`

**Description**: Performs comprehensive validation and analysis of the current supply chain structure.

**Parameters**: None

**Validation Checks**:
- Node connectivity validation
- Required node types presence
- Edge configuration completeness
- Risk assessment accuracy
- Data consistency checks

**How It Works**:
1. Runs `validateSupplyChain()` on current nodes and edges
2. Generates a validation summary with error/warning counts
3. Categorizes issues by severity (error vs warning)
4. Provides detailed feedback about validation status
5. Calls optional `onValidateSupplyChain` callback

**Output Types**:
- **Success**: "✅ Validation passed! X warnings found. Supply chain is ready for simulation."
- **Failure**: "❌ Validation failed! X errors and Y warnings found. Please fix errors before proceeding."

### 4. Optimize Supply Chain Structure

**Action Name**: `optimizeSupplyChainStructure_{panelId}`

**Description**: Provides intelligent optimization suggestions based on current supply chain analysis.

**Parameters**: None

**Optimization Analysis**:
- Node distribution analysis
- Connectivity assessment
- Risk exposure evaluation
- Geographic diversification review
- Critical validation issues identification

**Recommendation Categories**:
1. **Missing Node Types**: Suggests adding suppliers, factories, warehouses, or retailers
2. **Connectivity Issues**: Identifies orphaned nodes needing connections
3. **Risk Mitigation**: Suggests alternatives for high-risk connections
4. **Geographic Diversification**: Recommends spreading operations across regions
5. **Validation Fixes**: Highlights critical errors blocking simulation

**How It Works**:
1. Analyzes current supply chain structure
2. Generates recommendations using `generateRecommendations()`
3. Presents top 3 suggestions to the user
4. Provides actionable feedback for optimization

### 5. Load Supply Chain Template

**Action Name**: `loadSupplyChainTemplate_{panelId}`

**Description**: Loads predefined supply chain templates with enhanced name mapping.

**Parameters**:
- `templateName` (string, required): Name of template to load

**Available Templates**:

| User Input | Template ID | Description |
|------------|-------------|-------------|
| automotive | industry-automotive | Automotive industry supply chain |
| electronics | industry-electronics | Electronics & high-tech supply chain |
| food-beverage, food | industry-food-beverage | Food & beverage supply chain |
| pharma, pharmaceutical | industry-pharma | Pharmaceutical supply chain |
| fashion, apparel | industry-fashion | Fashion & apparel supply chain |
| energy | industry-energy | Energy & utilities supply chain |
| high-value | characteristics-high-value | High-value products supply chain |
| hazardous | characteristics-hazardous | Hazardous materials supply chain |
| domestic | geographic-domestic | Domestic operations supply chain |
| global | geographic-global | Global operations supply chain |
| tier1 | supplier-tiers-tier1 | Single-tier supplier network |
| tier3plus, tier3 | supplier-tiers-tier3plus | Multi-tier supplier network |

**How It Works**:
1. Maps user-friendly template names to internal template IDs
2. Validates template existence
3. Calls `onLoadTemplate` with the mapped template ID
4. Provides success/error feedback
5. Lists available templates if invalid name provided

### 6. Clear Canvas

**Action Name**: `clearCanvas_{panelId}`

**Description**: Removes all nodes and edges from the canvas for a fresh start.

**Parameters**: None

**How It Works**:
1. Calls the `onClearCanvas` callback
2. Removes all nodes and edges from the canvas
3. Provides confirmation feedback

## Advanced Features

### Unique Action Naming
Each action includes a randomly generated `panelId` suffix to prevent conflicts when multiple instances of the hook are used simultaneously.

### Comprehensive Data Exposure
The hook exposes detailed supply chain data to the AI including:
- Node configurations with all type-specific properties
- Edge risk assessments and alternative route data
- Real-time validation status
- Structural analysis and recommendations

### Intelligent Recommendations Engine

The `generateRecommendations()` function analyzes:

1. **Node Distribution**: Ensures all essential node types are present
2. **Connectivity**: Identifies isolated nodes requiring connections
3. **Risk Assessment**: Highlights high-risk connections needing alternatives
4. **Geographic Analysis**: Suggests diversification opportunities
5. **Validation Status**: Prioritizes critical error fixes

### Error Handling and User Feedback
- Comprehensive error messages for invalid inputs
- Success confirmations for completed actions
- Detailed validation feedback with error/warning categorization
- Template availability listings for failed template loads

## Usage Examples

### Natural Language Commands

```
"Add a supplier node for automotive parts"
→ Triggers: addSupplyChainNode with nodeType="supplier", label="automotive parts supplier"

"Build a pharmaceutical supply chain for regulated products with global operations"
→ Triggers: buildIndustrySpecificSupplyChain with industry="Pharma & Life Sciences", 
           productCharacteristics=["regulated"], operationsLocation=["global"]

"Validate my current supply chain"
→ Triggers: validateAndAnalyzeSupplyChain

"Load the automotive template"
→ Triggers: loadSupplyChainTemplate with templateName="automotive"

"Clear the canvas"
→ Triggers: clearCanvas
```

### Programmatic Usage

```typescript
const {
  nodesData,
  edgesData, 
  validationSummary,
  supplyChainAnalysis
} = useCopilotActions({
  nodes,
  edges,
  onAddNode: handleAddNode,
  onAddMultipleNodes: handleAddMultipleNodes,
  onLoadTemplate: handleLoadTemplate,
  onClearCanvas: handleClearCanvas,
  onValidateSupplyChain: handleValidateSupplyChain
});
```

## Integration Points

### Supply Chain Validator
- Real-time validation of nodes and edges
- Error categorization and severity assessment
- Validation summary generation

### Template Selector
- Intelligent template selection based on form data
- Industry-specific template recommendations
- Template metadata and reasoning

### React Flow Canvas
- Node and edge manipulation
- Canvas state management
- Visual feedback integration

### User Interface
- Toast notifications for action feedback
- Validation status indicators
- Real-time data updates

## Best Practices

1. **Always validate** before simulation using the validation action
2. **Use industry templates** as starting points for faster setup
3. **Add missing node types** based on recommendations
4. **Connect orphaned nodes** to ensure proper flow
5. **Consider geographic diversification** for risk mitigation
6. **Review high-risk connections** and add alternatives where possible

## Performance Considerations

- Actions are memoized with unique IDs to prevent conflicts
- Validation runs efficiently on node/edge changes
- Recommendations are generated on-demand
- Template loading is optimized for quick canvas population

This comprehensive action system enables users to build, validate, and optimize complex supply chain networks through natural language interactions while maintaining full programmatic control and detailed analytical insights. 