import type { Node as RFNode, Edge as RFEdge } from 'reactflow'

// -----------------------------------------------------------------------------
// Supply-Chain Digital-Twin – Global Type Definitions
// -----------------------------------------------------------------------------
// These types represent the React Flow node / edge structures that comprise a
// single Supply-Chain architecture ("arch").  They are used by the canvas layer,
// API wrappers, view-only mode, and any analytical utilities that need to work
// with the graph.
// -----------------------------------------------------------------------------

/**
 * React-Flow node extended for supply-chain usage.
 * We keep the generic `data` field open to allow any downstream component to
 * augment the shape without forcing union juggling at the root level.
 */
export type SupplyChainNode = RFNode<any>

/**
 * React-Flow edge extended for supply-chain usage.
 */
export type SupplyChainEdge = RFEdge<any>

/**
 * A minimal structure that captures the architecture for a single supply chain.
 * Additional properties such as `supply_chain_id`, `name`, etc. may exist in
 * backend responses, but the view-only feature only requires `nodes` & `edges`.
 */
export interface SupplyChainArch {
  nodes: SupplyChainNode[]
  edges: SupplyChainEdge[]
}

// Convenience re-exports for consumers that only need to import from one spot.
export type { SupplyChainNode as Node, SupplyChainEdge as Edge } 