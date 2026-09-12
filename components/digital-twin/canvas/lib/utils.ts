import { Edge } from 'reactflow';

/**
 * Ensures that all edges have a default type and a consistent data structure.
 * This is useful for migrating older edge data or ensuring uniformity.
 *
 * @param edges - An array of edges to process.
 * @returns A new array of edges with guaranteed `type` and `data` structure.
 */
export const migrateEdges = (edges: Edge[]): Edge[] => {
  return edges.map(edge => ({
    ...edge,
    type: edge.type || 'transportEdge', // Ensure all edges use our custom type
    data: {
      mode: 'road',
      cost: 100,
      transitTime: 1,
      riskMultiplier: 1.0,
      avgDelayDays: 0,
      frequencyOfDisruptions: 0,
      hasAltRoute: false,
      passesThroughChokepoint: false,
      ...edge.data // Preserve existing data
    }
  }));
}; 