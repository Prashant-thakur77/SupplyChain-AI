import { supabaseClient } from "@/lib/supabase/client"
import type {
  SupplyChain,
  Node as DbNode,
  Edge as DbEdge,
} from "@/lib/types/database"
import type { SupplyChainArch } from "@/types/supply-chain"
import { logAuditAction } from "@/lib/actions/audit-actions"

// Supply Chain CRUD operations
export async function getSupplyChains(userId :any): Promise<SupplyChain[]> {
  const query = supabaseClient.from("supply_chains").select("*").order("created_at", { ascending: false })
  // Only filter by user_id if not a placeholder
  if (userId && userId !== "placeholder-user-id") {
    query.eq("user_id", userId)
  }
  const { data, error } = await query
  if (error) {
    console.error("Error fetching supply chains:", error)
    throw error
  }
  return data || []
}


export async function createSupplyChain(supplyChain: Partial<SupplyChain>): Promise<SupplyChain> {
  const { data, error } = await supabaseClient.from("supply_chains").insert(supplyChain).select().single()

  if (error) {
    console.error("Error creating supply chain:", error)
    throw error
  }

  return data
}

export async function updateSupplyChain(supplyChainId: string, updates: Partial<SupplyChain>): Promise<SupplyChain> {
  const { data, error } = await supabaseClient
    .from("supply_chains")
    .update(updates)
    .eq("supply_chain_id", supplyChainId)
    .select()
    .single()

  if (error) {
    console.error("Error updating supply chain:", error)
    throw error
  }

  return data
}

export async function deleteSupplyChain(supplyChainId: string): Promise<void> {
  const { error } = await supabaseClient.from("supply_chains").delete().eq("supply_chain_id", supplyChainId)

  if (error) {
    console.error("Error deleting supply chain:", error)
    throw error
  }
}

// Node CRUD operations
export async function getNodes(supplyChainId: string): Promise<DbNode[]> {
  const { data, error } = await supabaseClient.from("nodes").select("*").eq("supply_chain_id", supplyChainId)

  if (error) {
    console.error("Error fetching nodes:", error)
    throw error
  }

  return data || []
}

export async function createNode(node: Partial<DbNode>): Promise<DbNode> {
  const { data, error } = await supabaseClient.from("nodes").insert(node).select().single()

  if (error) {
    console.error("Error creating node:", error)
    throw error
  }

  return data
}

export async function updateNode(nodeId: string, updates: Partial<DbNode>): Promise<DbNode> {
  const { data, error } = await supabaseClient.from("nodes").update(updates).eq("node_id", nodeId).select().single()

  if (error) {
    console.error("Error updating node:", error)
    throw error
  }

  return data
}

export async function deleteNode(nodeId: string): Promise<void> {
  const { error } = await supabaseClient.from("nodes").delete().eq("node_id", nodeId)

  if (error) {
    console.error("Error deleting node:", error)
    throw error
  }
}

// Edge CRUD operations
export async function getEdges(supplyChainId: string): Promise<DbEdge[]> {
  const { data, error } = await supabaseClient.from("edges").select("*").eq("supply_chain_id", supplyChainId)

  if (error) {
    console.error("Error fetching edges:", error)
    throw error
  }

  return data || []
}

export async function createEdge(edge: Partial<DbEdge>): Promise<DbEdge> {
  const { data, error } = await supabaseClient.from("edges").insert(edge).select().single()

  if (error) {
    console.error("Error creating edge:", error)
    throw error
  }

  return data
}

export async function updateEdge(edgeId: string, updates: Partial<DbEdge>): Promise<DbEdge> {
  const { data, error } = await supabaseClient.from("edges").update(updates).eq("edge_id", edgeId).select().single()

  if (error) {
    console.error("Error updating edge:", error)
    throw error
  }

  return data
}

export async function deleteEdge(edgeId: string): Promise<void> {
  const { error } = await supabaseClient.from("edges").delete().eq("edge_id", edgeId)

  if (error) {
    console.error("Error deleting edge:", error)
    throw error
  }
}

// Get complete supply chain with nodes and edges
export async function getCompleteSupplyChain(
  supplyChainId: string,
): Promise<{
  arch: SupplyChainArch | null
  nodes: DbNode[]
  edges: DbEdge[]
}> {
  const archPromise = getSupplyChainById(supplyChainId)
  const nodesPromise = getNodes(supplyChainId)
  const edgesPromise = getEdges(supplyChainId)

  const [arch, nodes, edges] = await Promise.all([
    archPromise,
    nodesPromise,
    edgesPromise,
  ])

  return {
    arch,
    nodes,
    edges,
  }
}

import { 
  getUserSupplyChainsAction, 
  saveSupplyChainAction, 
  deleteSupplyChainAction, 
  getSupplyChainByIdAction, 
  getNewsRoomInfoAction 
} from "@/lib/actions/edge-functions";

// ... other imports ...

/**
 * Get user supply chains from super-worker edge function (via server action)
 */
export async function getUserSupplyChains(userId: string) {
  try {
    const { data, error } = await getUserSupplyChainsAction(userId);

    if (error) {
      console.error('Super-worker edge function error:', error);
      throw new Error(error);
    }

    if (!data) {
      throw new Error('No data returned from super-worker edge function');
    }

    return data;
  } catch (error) {
    console.error('Error fetching user supply chains:', error);
    throw error;
  }
}

/**
 * Save supply chain data to the database via edge function (via server action)
 */
export async function saveSupplyChainToDatabase(supplyChainData: {
  name: string;
  description?: string;
  timestamp: string;
  organisation?: any;
  formData?: any;
  nodes: any[];
  edges: any[];
}) {

  // Validate that supply chain is not empty
  if (!supplyChainData.nodes || supplyChainData.nodes.length === 0) {
    throw new Error('Cannot save empty supply chain. Please add at least one node.');
  }

  try {
    const { data, error } = await saveSupplyChainAction(supplyChainData);

    if (error) {
      console.error('Edge function error:', error);
      throw new Error(error);
    }

    if (!data) {
      throw new Error('No data returned from edge function');
    }

    logAuditAction({ userId: 'system', action: 'supply_chain_saved', details: { status: 'success', summary: `Supply chain "${supplyChainData.name}" saved with ${supplyChainData.nodes.length} nodes and ${supplyChainData.edges.length} edges`, metadata: { name: supplyChainData.name, nodeCount: supplyChainData.nodes.length, edgeCount: supplyChainData.edges.length } } });

    return data;
  } catch (error) {
    console.error('Error saving supply chain:', error);
    throw error;
  }
}

/**
 * Delete supply chain via edge function (via server action)
 */
export async function deleteSupplyChainViaEdgeFunction(supplyChainId: string, organisationId: string) {
  try {
    const { data, error } = await deleteSupplyChainAction(supplyChainId, organisationId);

    if (error) {
      console.error('Edge function error:', error);
      throw new Error(error);
    }

    if (!data) {
      throw new Error('No data returned from edge function');
    }

    logAuditAction({ userId: 'system', action: 'supply_chain_deleted', details: { status: 'success', summary: `Supply chain ${supplyChainId} deleted`, metadata: { supplyChainId, organisationId } } });

    return data;
  } catch (error) {
    console.error('Error deleting supply chain:', error);
    throw error;
  }
}

/**
 * Get a single supply chain via the dynamic-endpoint edge function (via server action).
 * @param supplyChainId The ID of the supply chain to fetch.
 */
export async function getSupplyChainById(
  supplyChainId: string,
): Promise<SupplyChainArch> {
  try {
    const { data, error } = await getSupplyChainByIdAction(supplyChainId);

    if (error) {
      console.error('Edge function error:', error)
      throw new Error(error)
    }

    if (!data) {
      throw new Error('No data returned from dynamic-endpoint edge function')
    }

    // ---- Transform to React Flow compatible format ----------------------
    const rawNodes: any[] = data.data?.nodes || data.nodes || []
    const rawEdges: any[] = data.data?.edges || data.edges || []

    // Scale factors for converting geographic coordinates to canvas positions
    const LONGITUDE_SCALE = 100 // Adjust based on canvas width
    const LATITUDE_SCALE = -100 // Negative to flip Y-axis for typical canvas coordinates

    const transformedNodes = rawNodes.map((node: any) => {
      const id = node.id || node.node_id || `node-${rawNodes.indexOf(node)}`

      // Prefer explicit position; fallback to data.position; fallback to lat/lng (scaled)
      let position = node.position
      if (!position && node.data?.position) {
        position = node.data.position
      }
      if (
        !position &&
        typeof node.location_lat === "number" &&
        typeof node.location_lng === "number"
      ) {
        position = {
          x: node.location_lng * LONGITUDE_SCALE,
          y: node.location_lat * LATITUDE_SCALE,
        }
      }
      if (!position) {
        position = { x: 0, y: 0 }
      }

      return {
        ...node,
        id,
        position,
      }
    })

    const transformedEdges = rawEdges.map((edge: any) => {
      const id = edge.id || edge.edge_id || `${edge.from_node_id}-${edge.to_node_id}`
      return {
        ...edge,
        id,
        source: edge.source || edge.from_node_id,
        target: edge.target || edge.to_node_id,
      }
    })

    const arch: SupplyChainArch = {
      nodes: transformedNodes,
      edges: transformedEdges,
    }

    return arch
  } catch (error) {
    console.error('Error fetching from dynamic-endpoint:', error)
    throw error
  }
}

/**
 * Get news room info from get-news-room-info edge function (via server action)
 */
export async function getNewsRoomInfo(userId: string) {
  try {
    const { data, error } = await getNewsRoomInfoAction(userId);

    if (error) {
      console.error('get-news-room-info edge function error:', error)
      throw new Error(error)
    }

    if (!data) {
      throw new Error('No data returned from get-news-room-info edge function')
    }

    return data
  } catch (error) {
    console.error('Error fetching news room info:', error)
    throw error
  }
}

// Re-export shared types so downstream consumers can import from the API layer
export type {
  SupplyChainArch,
} from "@/types/supply-chain"
