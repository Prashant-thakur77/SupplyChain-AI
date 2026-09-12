import { Node, Edge } from 'reactflow';
import { ValidationIssue } from './types';

// Validate empty supply chain
function validateEmptySupplyChain(nodes: Node[], edges: Edge[]): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    if (nodes.length === 0) {
        issues.push({
            id: 'empty-supply-chain-nodes',
            elementId: 'graph',
            elementType: 'graph',
            severity: 'error',
            message: 'Supply chain cannot be empty. You must add at least one node (e.g., Supplier, Manufacturer, or Customer).',
            suggestion: 'Use the Digital Twin Assistant or the toolbar to add nodes to your supply chain before saving.'
        });
    }

    if (edges.length === 0 && nodes.length > 1) {
        issues.push({
            id: 'no-connections',
            elementId: 'graph',
            elementType: 'graph',
            severity: 'error',
            message: 'Supply chain nodes must be connected. Add connections between your nodes to define the flow.',
            suggestion: 'Connect your nodes by dragging from one node to another to create supply chain connections.'
        });
    }

    // Additional validation: minimum viable supply chain
    if (nodes.length === 1 && edges.length === 0) {
        issues.push({
            id: 'single-node-no-flow',
            elementId: 'graph',
            elementType: 'graph',
            severity: 'warning',
            message: 'A supply chain with only one node has no flow. Consider adding more nodes and connections.',
            suggestion: 'Add additional nodes (suppliers, manufacturers, distributors, customers) and connect them to model a complete supply chain.'
        });
    }

    return issues;
}

// A. Graph-Level Validation Functions
export function validateGraphStructure(nodes: Node[], edges: Edge[]): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // Check for empty supply chain (critical validation)
    issues.push(...validateEmptySupplyChain(nodes, edges));

    // Check for duplicate node IDs
    issues.push(...findDuplicateNodeIds(nodes));

    // Check for duplicate node names/labels
    issues.push(...findDuplicateNodeLabels(nodes));

    // Check for duplicate edge IDs
    issues.push(...findDuplicateEdgeIds(edges));

    // Check for orphaned nodes
    issues.push(...findOrphanedNodes(nodes, edges));

    // Check for disconnected components
    issues.push(...findDisconnectedComponents(nodes, edges));

    // Check for missing source or sink
    issues.push(...checkSourceAndSink(nodes, edges));

    // Check for circular dependencies
    issues.push(...findCircularDependencies(nodes, edges));

    return issues;
}

function findDuplicateNodeIds(nodes: Node[]): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const idCount = new Map<string, Node[]>();

    // Group nodes by ID
    for (const node of nodes) {
        if (!node || !node.id) continue; // Skip invalid nodes
        if (!idCount.has(node.id)) {
            idCount.set(node.id, []);
        }
        const existing = idCount.get(node.id);
        if (existing) {
            existing.push(node);
        }
    }

    // Find duplicates
    for (const [id, nodeGroup] of idCount) {
        if (nodeGroup.length > 1) {
            for (const node of nodeGroup) {
                issues.push({
                    id: `duplicate-id-${id}`,
                    elementId: node.id,
                    elementType: 'node',
                    severity: 'error',
                    message: `Node ID '${id}' is used by multiple nodes. Each node must have a unique ID.`,
                    suggestion: 'Delete one of the duplicate nodes or regenerate the supply chain to ensure unique IDs.'
                });
            }
        }
    }

    return issues;
}

function findDuplicateNodeLabels(nodes: Node[]): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const labelCount = new Map<string, Node[]>();

    // Group nodes by label (only for non-empty labels)
    for (const node of nodes) {
        if (!node || !node.data) continue; // Skip invalid nodes
        const label = node.data.label?.trim();
        if (label) {
            if (!labelCount.has(label)) {
                labelCount.set(label, []);
            }
            const existing = labelCount.get(label);
            if (existing) {
                 existing.push(node);
            }
        }
    }

    // Find duplicates
    for (const [label, nodeGroup] of labelCount) {
        if (nodeGroup.length > 1) {
            for (const node of nodeGroup) {
                issues.push({
                    id: `duplicate-label-${node.id}`,
                    elementId: node.id,
                    elementType: 'node',
                    severity: 'warning',
                    message: `Multiple nodes have the same name '${label}'. This can be confusing when identifying nodes.`,
                    suggestion: 'Give each node a unique, descriptive name to make them easier to distinguish.'
                });
            }
        }
    }

    return issues;
}

function findDuplicateEdgeIds(edges: Edge[]): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const idCount = new Map<string, Edge[]>();

    // Group edges by ID
    for (const edge of edges) {
        if (!edge || !edge.id) continue;
        if (!idCount.has(edge.id)) {
            idCount.set(edge.id, []);
        }
        const existing = idCount.get(edge.id);
        if (existing) {
             existing.push(edge);
        }
    }

    // Find duplicates
    for (const [id, edgeGroup] of idCount) {
        if (edgeGroup.length > 1) {
            for (const edge of edgeGroup) {
                issues.push({
                    id: `duplicate-edge-id-${id}`,
                    elementId: edge.id,
                    elementType: 'edge',
                    severity: 'error',
                    message: `Edge ID '${id}' is used by multiple connections. Each connection must have a unique ID.`,
                    suggestion: 'Delete one of the duplicate connections or regenerate the supply chain to ensure unique IDs.'
                });
            }
        }
    }

    return issues;
}

function findOrphanedNodes(nodes: Node[], edges: Edge[]): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    for (const node of nodes) {
        const hasIncomingEdge = edges.some(edge => edge.target === node.id);
        const hasOutgoingEdge = edges.some(edge => edge.source === node.id);

        if (!hasIncomingEdge && !hasOutgoingEdge) {
            issues.push({
                id: `orphaned-${node.id}`,
                elementId: node.id,
                elementType: 'node',
                severity: 'error',
                message: `Node '${node.data.label || node.id}' is not connected to the supply chain.`,
                suggestion: 'Connect this node to another node, or remove it if it\'s not part of the supply chain.'
            });
        }
    }

    return issues;
}

function findDisconnectedComponents(nodes: Node[], edges: Edge[]): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    console.log('🔍 [GraphValidator] findDisconnectedComponents called');
    console.log('🔍 [GraphValidator] Input data:', {
        nodesCount: nodes?.length || 0,
        edgesCount: edges?.length || 0,
        nodesValid: nodes !== null && nodes !== undefined,
        edgesValid: edges !== null && edges !== undefined,
        nodesIsArray: Array.isArray(nodes),
        edgesIsArray: Array.isArray(edges)
    });

    if (nodes.length === 0) {
        console.log('🔍 [GraphValidator] No nodes found, returning empty issues');
        return issues;
    }

    // Build adjacency list (treating edges as undirected for connectivity check)
    const adjacencyList: Record<string, string[]> = {};
    console.log('🔍 [GraphValidator] Building adjacency list...');
    
    for (const node of nodes) {
        console.log(`🔍 [GraphValidator] Adding node to adjacency list: ${node.id}`);
        adjacencyList[node.id] = [];
    }
    
    console.log('🔍 [GraphValidator] Adjacency list initialized:', Object.keys(adjacencyList));

    console.log('🔍 [GraphValidator] Processing edges...');
    for (const edge of edges) {
        console.log(`🔍 [GraphValidator] Processing edge:`, {
            id: edge.id,
            source: edge.source,
            target: edge.target,
            sourceExists: edge.source in adjacencyList,
            targetExists: edge.target in adjacencyList
        });
        
        if (!adjacencyList[edge.source]) {
            console.error(`❌ [GraphValidator] Edge source '${edge.source}' not found in adjacency list!`);
            console.error(`❌ [GraphValidator] Available node IDs:`, Object.keys(adjacencyList));
            console.error(`❌ [GraphValidator] Problematic edge:`, edge);
            // Create the array if it doesn't exist to prevent the error
            adjacencyList[edge.source] = [];
        }
        
        if (!adjacencyList[edge.target]) {
            console.error(`❌ [GraphValidator] Edge target '${edge.target}' not found in adjacency list!`);
            console.error(`❌ [GraphValidator] Available node IDs:`, Object.keys(adjacencyList));
            console.error(`❌ [GraphValidator] Problematic edge:`, edge);
            // Create the array if it doesn't exist to prevent the error
            adjacencyList[edge.target] = [];
        }
        
        adjacencyList[edge.source].push(edge.target);
        adjacencyList[edge.target].push(edge.source);
    }

    console.log('🔍 [GraphValidator] Adjacency list built successfully');

    // Find connected components using DFS
    const visited = new Set<string>();
    const components: string[][] = [];

    for (const node of nodes) {
        if (!visited.has(node.id)) {
            const component: string[] = [];
            dfs(node.id, adjacencyList, visited, component);
            components.push(component);
        }
    }

    console.log(`🔍 [GraphValidator] Found ${components.length} components`);

    // If more than one component, report as error
    if (components.length > 1) {
        console.log('❌ [GraphValidator] Multiple disconnected components detected');
        issues.push({
            id: 'disconnected-components',
            elementId: 'graph',
            elementType: 'graph',
            severity: 'error',
            message: `The supply chain has ${components.length} disconnected parts.`,
            suggestion: 'Ensure all parts of the supply chain are connected to form a single network.'
        });
    }

    return issues;
}

function dfs(nodeId: string, adjacencyList: Record<string, string[]>, visited: Set<string>, component: string[]) {
    visited.add(nodeId);
    component.push(nodeId);

    for (const neighbor of adjacencyList[nodeId]) {
        if (!visited.has(neighbor)) {
            dfs(neighbor, adjacencyList, visited, component);
        }
    }
}

function checkSourceAndSink(nodes: Node[], edges: Edge[]): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    const nodesWithIncoming = new Set(edges.map(e => e.target));
    const nodesWithOutgoing = new Set(edges.map(e => e.source));

    const sourceNodes = nodes.filter(node => !nodesWithIncoming.has(node.id));
    const sinkNodes = nodes.filter(node => !nodesWithOutgoing.has(node.id));

    if (sourceNodes.length === 0 && nodes.length > 0) {
        issues.push({
            id: 'missing-source',
            elementId: 'graph',
            elementType: 'graph',
            severity: 'warning',
            message: 'The supply chain may be missing a starting point (e.g., Supplier).',
            suggestion: 'Review your supply chain to ensure it models the complete flow from start to finish.'
        });
    }

    if (sinkNodes.length === 0 && nodes.length > 0) {
        issues.push({
            id: 'missing-sink',
            elementId: 'graph',
            elementType: 'graph',
            severity: 'warning',
            message: 'The supply chain may be missing an endpoint (e.g., Retailer).',
            suggestion: 'Review your supply chain to ensure it models the complete flow from start to finish.'
        });
    }

    return issues;
}

function findCircularDependencies(nodes: Node[], edges: Edge[]): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // Build adjacency list
    const adjacencyList: Record<string, string[]> = {};
    for (const node of nodes) {
        adjacencyList[node.id] = [];
    }

    for (const edge of edges) {
        // Defensive check: ensure the source node exists in adjacency list
        if (!adjacencyList[edge.source]) {
            console.error(`❌ [GraphValidator] Edge source '${edge.source}' not found in adjacency list!`);
            console.error(`❌ [GraphValidator] Available node IDs:`, Object.keys(adjacencyList));
            console.error(`❌ [GraphValidator] Problematic edge:`, edge);
            
            // Add validation issue for missing source node
            issues.push({
                id: `missing-source-node-${edge.id}`,
                elementId: edge.id,
                elementType: 'edge',
                severity: 'error',
                message: `Connection references a non-existent source node '${edge.source}'.`,
                suggestion: 'Remove this connection or ensure the source node exists in the supply chain.'
            });
            
            // Create the array if it doesn't exist to prevent the error
            adjacencyList[edge.source] = [];
        }
        
        // Defensive check: ensure the target node exists in adjacency list
        if (!adjacencyList[edge.target]) {
            console.error(`❌ [GraphValidator] Edge target '${edge.target}' not found in adjacency list!`);
            console.error(`❌ [GraphValidator] Available node IDs:`, Object.keys(adjacencyList));
            console.error(`❌ [GraphValidator] Problematic edge:`, edge);
            
            // Add validation issue for missing target node
            issues.push({
                id: `missing-target-node-${edge.id}`,
                elementId: edge.id,
                elementType: 'edge',
                severity: 'error',
                message: `Connection references a non-existent target node '${edge.target}'.`,
                suggestion: 'Remove this connection or ensure the target node exists in the supply chain.'
            });
            
            // Create the array if it doesn't exist to prevent the error
            adjacencyList[edge.target] = [];
        }
        
        adjacencyList[edge.source].push(edge.target);
    }

    // DFS to detect cycles
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    for (const node of nodes) {
        if (!visited.has(node.id)) {
            const cycleNodes = detectCycle(node.id, adjacencyList, visited, recursionStack, []);
            if (cycleNodes.length > 0) {
                const cycleNodeLabels = cycleNodes.map(id => {
                    const node = nodes.find(n => n.id === id);
                    return node?.data.label || id;
                }).join(' → ');

                issues.push({
                    id: `circular-dependency-${cycleNodes[0]}`,
                    elementId: cycleNodes[0],
                    elementType: 'node',
                    severity: 'error',
                    message: `A circular dependency was detected: ${cycleNodeLabels}`,
                    suggestion: 'Remove the connection that creates the loop. Supply chains should generally flow in one direction.'
                });
                break; // Report only the first cycle found
            }
        }
    }

    return issues;
}

function detectCycle(
    nodeId: string,
    adjacencyList: Record<string, string[]>,
    visited: Set<string>,
    recursionStack: Set<string>,
    path: string[]
): string[] {
    visited.add(nodeId);
    recursionStack.add(nodeId);
    path.push(nodeId);

    for (const neighbor of adjacencyList[nodeId]) {
        if (!visited.has(neighbor)) {
            const cycleNodes = detectCycle(neighbor, adjacencyList, visited, recursionStack, [...path]);
            if (cycleNodes.length > 0) return cycleNodes;
        } else if (recursionStack.has(neighbor)) {
            // Found a cycle - return the cycle path
            const cycleStart = path.indexOf(neighbor);
            return path.slice(cycleStart).concat([neighbor]);
        }
    }

    recursionStack.delete(nodeId);
    return [];
} 