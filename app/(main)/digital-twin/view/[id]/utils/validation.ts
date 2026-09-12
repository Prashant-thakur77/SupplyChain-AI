export interface DataValidationError {
  type:
    | 'missing_data'
    | 'invalid_nodes'
    | 'invalid_edges'
    | 'missing_positions'
    | 'invalid_references'
    | 'malformed_data'
  message: string
  details?: string[]
  count?: number
}

// Comprehensive data validation function
export function validateSupplyChainData(arch: any): DataValidationError[] {
  const errors: DataValidationError[] = []

  // Check if arch exists
  if (!arch) {
    errors.push({
      type: 'missing_data',
      message: 'Supply chain data is missing',
      details: ['The loaded architecture data is null or undefined'],
    })
    return errors
  }

  // Check top level structure
  if (typeof arch !== 'object' || arch === null) {
    errors.push({
      type: 'malformed_data',
      message: 'Supply chain data is not a valid object',
      details: ['The root of the data should be an object.'],
    })
    return errors
  }

  // Check if nodes exist and are valid
  if (!arch.nodes) {
    errors.push({
      type: 'invalid_nodes',
      message: 'Nodes data is missing',
      details: ['No nodes array found in the supply chain data'],
    })
  } else if (!Array.isArray(arch.nodes)) {
    errors.push({
      type: 'invalid_nodes',
      message: 'Nodes data is not an array',
      details: [`Expected array but got ${typeof arch.nodes}`],
    })
  } else {
    // Validate each node
    const nodeIssues: string[] = []
    const missingPositions: string[] = []

    arch.nodes.forEach((node: any, index: number) => {
      if (!node || typeof node !== 'object') {
        nodeIssues.push(
          `Node at index ${index} is null, undefined, or not an object.`,
        )
        return
      }

      // Check for node ID (support both React Flow format and database format)
      const nodeId = node.id || node.node_id
      if (!nodeId) {
        nodeIssues.push(`Node at index ${index} is missing an ID.`)
      }

      // Check for position data (support both React Flow format and database format)
      const hasReactFlowPosition =
        node.position &&
        typeof node.position === 'object' &&
        typeof node.position.x === 'number' &&
        !isNaN(node.position.x) &&
        typeof node.position.y === 'number' &&
        !isNaN(node.position.y)

      const hasDatabasePosition =
        typeof node.location_lat === 'number' &&
        !isNaN(node.location_lat) &&
        typeof node.location_lng === 'number' &&
        !isNaN(node.location_lng)

      if (!hasReactFlowPosition && !hasDatabasePosition) {
        missingPositions.push(
          `Node "${nodeId || 'at index ' + index}" is missing position data.`,
        )
      }

      if (node.type && typeof node.type !== 'string') {
        nodeIssues.push(
          `Node "${nodeId || 'at index ' + index}" has invalid type.`,
        )
      }
    })

    if (nodeIssues.length > 0) {
      errors.push({
        type: 'invalid_nodes',
        message: 'Invalid node data detected',
        details: nodeIssues,
        count: nodeIssues.length,
      })
    }

    if (missingPositions.length > 0) {
      errors.push({
        type: 'missing_positions',
        message: 'Nodes with missing or invalid position data',
        details: missingPositions,
        count: missingPositions.length,
      })
    }
  }

  // Check if edges exist and are valid
  if (!arch.edges) {
    errors.push({
      type: 'invalid_edges',
      message: 'Edges data is missing',
      details: ['No edges array found in the supply chain data'],
    })
  } else if (!Array.isArray(arch.edges)) {
    errors.push({
      type: 'invalid_edges',
      message: 'Edges data is not an array',
      details: [`Expected array but got ${typeof arch.edges}`],
    })
  } else {
    // Validate each edge
    const edgeIssues: string[] = []
    const referenceIssues: string[] = []

    // Build node ID set (support both formats)
    const nodeIds = new Set(
      arch.nodes?.map((n: any) => n?.id || n?.node_id).filter(Boolean) || [],
    )

    arch.edges.forEach((edge: any, index: number) => {
      if (!edge || typeof edge !== 'object') {
        edgeIssues.push(
          `Edge at index ${index} is null, undefined, or not an object.`,
        )
        return
      }

      // Check for edge ID (support both React Flow format and database format)
      const edgeId = edge.id || edge.edge_id
      if (!edgeId) {
        edgeIssues.push(`Edge at index ${index} is missing an ID.`)
      }

      // Check for source (support both React Flow format and database format)
      const source = edge.source || edge.from_node_id
      if (!source) {
        edgeIssues.push(
          `Edge "${edgeId || 'at index ' + index}" is missing source.`,
        )
      } else if (nodeIds.size > 0 && !nodeIds.has(source)) {
        referenceIssues.push(
          `Edge "${
            edgeId || 'at index ' + index
          }" references non-existent source node "${source}".`,
        )
      }

      // Check for target (support both React Flow format and database format)
      const target = edge.target || edge.to_node_id
      if (!target) {
        edgeIssues.push(
          `Edge "${edgeId || 'at index ' + index}" is missing target.`,
        )
      } else if (nodeIds.size > 0 && !nodeIds.has(target)) {
        referenceIssues.push(
          `Edge "${
            edgeId || 'at index ' + index
          }" references non-existent target node "${target}".`,
        )
      }

      if (edge.type && typeof edge.type !== 'string') {
        edgeIssues.push(
          `Edge "${edgeId || 'at index ' + index}" has invalid type.`,
        )
      }
    })

    if (edgeIssues.length > 0) {
      errors.push({
        type: 'invalid_edges',
        message: 'Invalid edge data detected',
        details: edgeIssues,
        count: edgeIssues.length,
      })
    }

    if (referenceIssues.length > 0) {
      errors.push({
        type: 'invalid_references',
        message: 'Edges with invalid node references',
        details: referenceIssues,
        count: referenceIssues.length,
      })
    }
  }

  return errors
} 