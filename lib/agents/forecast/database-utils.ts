/**
 * Database Utilities for Forecast Agent
 * 
 * Provides functions to fetch valid IDs from the database
 * to ensure all forecast data uses real, existing entities
 */

import { supabaseServer } from '../../supabase/server';

/**
 * Fetch a valid supply chain ID from the database
 * If a specific ID is provided, verify it exists. Otherwise, get any valid one.
 */
export async function getValidSupplyChainId(preferredId?: string): Promise<string | null> {
  try {
    if (preferredId) {
      // Verify the preferred ID exists
      const { data, error } = await supabaseServer
        .from('supply_chains')
        .select('supply_chain_id')
        .eq('supply_chain_id', preferredId)
        .single();
      
      if (!error && data) {
        return data.supply_chain_id;
      }
    }

    // If no preferred ID or it doesn't exist, get any valid supply chain
    const { data, error } = await supabaseServer
      .from('supply_chains')
      .select('supply_chain_id')
      .limit(1)
      .single();

    if (!error && data) {
      return data.supply_chain_id;
    }

    return null;
  } catch (error) {
    console.error('Error fetching valid supply chain ID:', error);
    return null;
  }
}

/**
 * Fetch a valid user ID from the database
 * This is a fallback function when no specific user is provided
 */
export async function getValidUserId(): Promise<string | null> {
  try {
    // Try to get any valid user ID from the database
    // This assumes you have a users table or similar
    const { data, error } = await supabaseServer
      .from('users')
      .select('id')
      .limit(1)
      .single();

    if (!error && data) {
      return data.id;
    }

    return null;
  } catch (error) {
    console.error('Error fetching valid user ID:', error);
    return null;
  }
}

/**
 * Fetch a valid node ID from the database
 * If a specific supply chain ID is provided, get a node from that chain
 */
export async function getValidNodeId(supplyChainId?: string): Promise<string | null> {
  try {
    let query = supabaseServer
      .from('nodes')
      .select('node_id')
      .limit(1);

    if (supplyChainId) {
      query = query.eq('supply_chain_id', supplyChainId);
    }

    const { data, error } = await query.single();

    if (!error && data) {
      return data.node_id;
    }

    return null;
  } catch (error) {
    console.error('Error fetching valid node ID:', error);
    return null;
  }
}

/**
 * Validate that a UUID is properly formatted
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Generate a valid UUID v4 (fallback only)
 * This should only be used when database lookup fails
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
