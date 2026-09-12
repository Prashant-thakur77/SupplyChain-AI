import { Node, Edge } from 'reactflow';

/**
 * Basic implementation of BFS for route computation that avoids disrupted nodes and edges.
 * Given a starting node and target nodes, finds paths.
 */
export function findAlternateRoutes(
  nodes: Node[],
  edges: Edge[],
  disruptedNodes: string[],
  disruptedEdges: string[],
  sourceId: string,
  targetIds: string[]
) {
  // A simple BFS pathfinding ignoring disrupted elements
  const paths: Record<string, string[]> = {};
  
  const queue: { current: string; path: string[] }[] = [];
  queue.push({ current: sourceId, path: [sourceId] });
  
  const visited = new Set<string>();
  visited.add(sourceId);
  
  while (queue.length > 0) {
    const { current, path } = queue.shift()!;
    
    // If we reached one of the targets, save the path
    if (targetIds.includes(current)) {
      if (!paths[current] || path.length < paths[current].length) {
        paths[current] = path;
      }
    }
    
    // Find valid outgoing edges
    const validEdges = edges.filter(e => 
      e.source === current && 
      !disruptedEdges.includes(e.id) && 
      !disruptedNodes.includes(e.target)
    );
    
    for (const edge of validEdges) {
      if (!visited.has(edge.target)) {
        visited.add(edge.target);
        queue.push({
          current: edge.target,
          path: [...path, edge.target]
        });
      }
    }
  }
  
  return paths;
}
