import { supabaseClient } from "@/lib/supabase/client";
import { supabaseServer } from "@/lib/supabase/server";

// Type definitions for the intelligence data
export interface NewsItem {
  summary: string;
  time: string;
  originCountry: string;
  numericalData?: string[];
}

export interface WeatherInfo {
  summary: string;
  time: string;
  originCountry: string;
  details?: string[];
}

export interface NodeIntel {
  nodeId: string;
  news: NewsItem[];
  weather: WeatherInfo;
}

export interface SupplyChainIntel {
  intel_id: string;
  user_id: string;
  supply_chain_id: string;
  node_id: string;
  created_at: string;
  news: NewsItem[];
  weather: WeatherInfo;
}

/**
 * Store intelligence data for supply chain nodes
 */
export async function storeSupplyChainIntel(
  userId: string,
  supplyChainId: string,
  intelData: NodeIntel[]
): Promise<void> {
  try {
    console.log(`Storing intel for user ${userId}, supply chain ${supplyChainId}`);
    
    // Convert the intel data to database records
    const records = intelData.map(node => ({
      user_id: userId,
      supply_chain_id: supplyChainId,
      node_id: node.nodeId,
      news: node.news,
      weather: node.weather
    }));
    
    // Insert records into the database
    const { error } = await supabaseServer
      .from('supply_chain_intel')
      .insert(records);
    
    if (error) {
      console.error('Error storing supply chain intel:', error);
      throw error;
    }
    
    console.log(`Successfully stored intel for ${records.length} nodes`);
  } catch (error) {
    console.error('Error in storeSupplyChainIntel:', error);
    throw error;
  }
}

/**
 * Get the latest intelligence data for a supply chain
 */
export async function getLatestSupplyChainIntel(
  supplyChainId: string
): Promise<SupplyChainIntel[]> {
  try {
    // Get the latest intel for each node in the supply chain
    const { data, error } = await supabaseClient
      .from('supply_chain_intel')
      .select('*')
      .eq('supply_chain_id', supplyChainId)
      .order('created_at', { ascending: false }) as { data: any[] | null, error: any };
    
    if (error) {
      console.error('Error fetching supply chain intel:', error);
      throw error;
    }
    
    // Get unique nodes with latest data
    const latestByNode: Record<string, SupplyChainIntel> = {};
    data?.forEach(item => {
      if (!latestByNode[item.node_id] || 
          new Date(item.created_at) > new Date(latestByNode[item.node_id].created_at)) {
        latestByNode[item.node_id] = item as SupplyChainIntel;
      }
    });
    
    return Object.values(latestByNode);
  } catch (error) {
    console.error('Error in getLatestSupplyChainIntel:', error);
    throw error;
  }
}

/**
 * Get historical intelligence data for a supply chain node
 */
export async function getNodeIntelHistory(
  nodeId: string,
  limit: number = 10
): Promise<SupplyChainIntel[]> {
  try {
    const { data, error } = await supabaseClient
      .from('supply_chain_intel')
      .select('*')
      .eq('node_id', nodeId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching node intel history:', error);
      throw error;
    }
    
    return data as SupplyChainIntel[];
  } catch (error) {
    console.error('Error in getNodeIntelHistory:', error);
    throw error;
  }
}