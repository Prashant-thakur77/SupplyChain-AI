# Digital Twin Validation Engine: TODO & Checklist

This document outlines the validation conditions and implementation plan for ensuring the logical and structural integrity of a digital twin supply chain before it's saved to the database.

## 1. High-Level Implementation Plan

1.  **Create a Validation Service:**
    *   Develop a `ValidationService` (e.g., `lib/validation/supply-chain-validator.ts`).
    *   This service will contain functions that accept the `nodes` and `edges` array from the `DigitalTwinCanvas`.
    *   The main function, `validateSupplyChain(nodes, edges)`, will return a list of issues.

2.  **Define Issue Structure:**
    *   Each issue should be an object with the following structure:
        ```typescript
        interface ValidationIssue {
          id: string; // Unique ID for the issue
          elementId: string; // ID of the node or edge with the issue
          elementType: 'node' | 'edge';
          severity: 'error' | 'warning';
          message: string; // User-friendly error message
          suggestion: string; // Actionable advice on how to fix it
        }
        ```

3.  **Integrate with Save Flow:**
    *   In `components/digital-twin/digital-twin-canvas.tsx`, modify the `handleSave` function.
    *   Before calling `insertSupplyChain`, call the new `ValidationService`.
    *   `const issues = validateSupplyChain(nodes, edges);`

4.  **Create a Validation Summary Dialog:**
    *   If `issues` array is not empty, prevent the save operation.
    *   Display a `Dialog` component that lists the issues.
    *   Group issues by `severity` ('Errors' must be fixed, 'Warnings' are recommendations).
    *   The dialog should block saving if there are any `error` level issues. It could allow saving if there are only `warnings`, after user confirmation.

5.  **User Interaction:**
    *   When a user clicks on an issue in the dialog, the canvas should pan to and highlight the corresponding node or edge.

---

## 2. Validation Checklist

Here is a detailed list of conditions to validate.

### A. Graph-Level Validation (Holistic)

These checks look at the entire supply chain structure.

-   [ ] **Orphaned Nodes:**
    *   **Condition:** A node has no incoming or outgoing edges.
    *   **Severity:** `Error`
    *   **Message:** "Node '{node.label}' is not connected to the supply chain."
    *   **Suggestion:** "Connect this node to another node, or remove it if it's not part of the supply chain."

-   [ ] **Disconnected Components:**
    *   **Condition:** The graph is split into two or more sub-graphs that are not connected.
    *   **Severity:** `Error`
    *   **Message:** "The supply chain has multiple disconnected parts."
    *   **Suggestion:** "Ensure all parts of the supply chain are connected to form a single network."

-   [ ] **Missing Source or Sink:**
    *   **Condition:** The graph lacks a clear starting point (a source node with no incoming edges) or an ending point (a sink node with no outgoing edges).
    *   **Severity:** `Warning`
    *   **Message:** "The supply chain may be missing a starting point (e.g., Supplier) or an endpoint (e.g., Retailer)."
    *   **Suggestion:** "Review your supply chain to ensure it models the complete flow from start to finish."

-   [ ] **Circular Dependencies:**
    *   **Condition:** A cycle is detected in the graph (e.g., A -> B -> C -> A).
    *   **Severity:** `Error`
    *   **Message:** "A circular dependency was detected involving node '{node.label}'."
    *   **Suggestion:** "Remove the connection that creates the loop. Supply chains should generally flow in one direction."

### B. Node-Level Validation

These checks validate individual node properties.

-   [ ] **Incomplete Essential Data:**
    *   **Condition:** Core fields are missing.
    *   **Severity:** `Error`
    *   **Checks:**
        *   `label` (name) is missing or empty.
        *   `type` (e.g., Supplier, Manufacturer) is not set.
        *   `country` or `address` is missing.
    *   **Message:** "Node '{node.label}' is missing required information: {list of missing fields}."
    *   **Suggestion:** "Select the node and fill in all the required fields in the 'General' and 'Location' sections."

-   [ ] **Invalid Numeric Values:**
    *   **Condition:** Numeric properties are outside their logical bounds.
    *   **Severity:** `Error`
    *   **Checks:**
        *   `riskScore` is not between 0 and 1.
        *   `criticality` is not within its defined range (e.g., 1-10).
        *   Type-specific fields like `productionCapacity`, `storageCapacity`, `inventoryLevel`, `leadTime` are negative.
    *   **Message:** "Node '{node.label}' has an invalid value for '{field.name}'."
    *   **Suggestion:** "The value for '{field.name}' must be a positive number (or within a specific range)."

### C. Edge-Level Validation

These checks validate individual edge properties.

-   [ ] **Incomplete Connection Data:**
    *   **Condition:** Core edge properties are missing or zero.
    *   **Severity:** `Error`
    *   **Checks:**
        *   `cost` is not set (or is <= 0).
        *   `transitTime` is not set (or is <= 0).
    *   **Message:** "The connection between '{source.label}' and '{target.label}' has missing or invalid data."
    *   **Suggestion:** "Select the edge and provide a valid Cost and Transit Time."

-   [ ] **Logical Transport Mode Issues:**
    *   **Condition:** The transport mode seems illogical for the context.
    *   **Severity:** `Warning`
    *   **Checks:**
        *   `mode` is 'Sea' or 'Air', but source and target nodes are in the same country.
        *   `mode` is 'Sea', but the locations are landlocked.
    *   **Message:** "The transport mode between '{source.label}' and '{target.label}' might be inefficient or impossible."
    *   **Suggestion:** "Review the transport mode. Consider 'Road' or 'Rail' for domestic connections."

### D. Cross-Element Validation (Logical Flow)

These checks look at the relationships between connected nodes and edges.

-   [ ] **Illogical Supply Chain Flow:**
    *   **Condition:** The direction of flow seems incorrect based on node types.
    *   **Severity:** `Warning`
    *   **Checks:**
        *   A `Retailer` connects *to* a `Manufacturer`.
        *   A `Manufacturer` connects *to* a `Raw Material Supplier`.
    *   **Message:** "An unconventional connection exists from a '{source.type}' to a '{target.type}'."
    *   **Suggestion:** "Verify that the direction of this connection is correct. Typically, goods flow from suppliers to retailers."

-   [ ] **Product/Transport Mismatch:**
    *   **Condition:** Based on `EDGE_PROPERTY_SPECS`, required properties for a transport leg are missing.
    *   **Severity:** `Warning`
    *   **Example from `EdgeConfiguration.tsx`:**
        *   A connection between pharma nodes might require `temperatureControl`. If that's `false` or not set, it's a risk.
        *   Hazardous materials might require special handling properties on the edge.
    *   **Message:** "The connection from '{source.label}' to '{target.label}' may be missing critical properties for the types of products handled."
    *   **Suggestion:** "Select the edge and review the 'Risk & Disruption Analysis' section to ensure all relevant factors are configured." 