import { NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { z } from 'zod';
import { supabaseServer } from '@/lib/supabase/server';
import { storeSupplyChainIntel, NodeIntel } from '@/lib/api/supply-chain-intel';
import { AI_MODELS, getAIKeyForModule } from '@/lib/ai-config';

// Enhanced schema: array of node intel objects
const NodeIntelSchema = z.object({
  nodeId: z.string(),
  news: z.array(z.object({
    summary: z.string().describe("Concise news summary, include key metrics"),
    time: z.string().describe("ISO timestamp of the news"),
    originCountry: z.string(),
    numericalData: z.array(z.string()).optional().describe("Important numbers/statistics, if any")
  })).describe("Top 3 most important news items"),
  weather: z.object({
    summary: z.string().describe("Concise weather summary"),
    time: z.string().describe("ISO timestamp of the weather report"),
    originCountry: z.string(),
    details: z.array(z.string()).optional().describe("Additional weather details")
  }).describe("Latest weather report")
});

const intelSchema = z.array(NodeIntelSchema);

// Single call to collect all node intel in bulk
async function getAllNodeIntel(supplyChainData:any) {
  const prompt = `
  Today's date is ${new Date().toISOString()}. the news should be latest and contain only the most lastest information. of today date only. 2025 news ans weathear only. include us tariff geo political event which deisrupted port nodes.
You are a Supply Chain Disruption Intelligence Agent. You will be given a list of nodes (suppliers, factories, ports, warehouses, etc.) with their IDs, types, locations, and attributes. For each node, you must:

1. Retrieve the three most critical news items from the past 24 hours that could disrupt or materially impact that node's operations. Focus on:
   • Natural disaster alerts (storms, floods, earthquakes)  
   • Extreme weather forecasts (heatwaves, heavy precipitation, high winds)  
   • Geopolitical developments (trade embargoes, sanctions, labor strikes, civil unrest)  
   • Regulatory or policy changes affecting logistics or imports/exports  
   • Major operational disruptions (port congestions, carrier delays, factory shutdowns)  
   For each news item, return:
     – summary: a 1–2 sentence concise description  
     – time: ISO 8601 timestamp of publication or event  
     –originCountry: country of the event  
     –numericalData (optional): any key metrics (e.g. "–20% output," "500 containers delayed")  

2. Fetch the very latest weather forecast or advisory for the node's exact location. Emphasize conditions that may affect supply chain resilience (e.g., severe storms, temperature extremes, precipitation, wind). Return:
     – summary: brief overview of current or imminent conditions  
     – time: ISO 8601 timestamp of the forecast/report  
     – originCountry: country or region  
     – details (optional): additional observations (e.g. "heavy rainfall 50 mm in 24 h," "gusts up to 80 km/h")  

 Only output a JSON array of objects matching the schema exactly—no extra commentary, no markdown—so it can be ingested directly by downstream systems.  


Supply chain context:
${JSON.stringify(supplyChainData)}

Return a JSON array matching this schema exactly without extra commentary.
`;

  const google = createGoogleGenerativeAI({ apiKey: getAIKeyForModule('agents') });
  const { object } = await generateObject({
    model: google(AI_MODELS.agents, { useSearchGrounding: true }),
    schema: intelSchema,
    prompt
  });

  return object;
}

// ✅ API Handler
export async function GET(request:any) {
  try {
    // Use the existing supabaseServer client
    const supabase = supabaseServer;

    // Fetch all users from the database
    console.log("Fetching users from database...");
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*');
      
    if (usersError) {
      console.error("Error fetching users:", usersError);
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }
    
    if (!users || users.length === 0) {
      return NextResponse.json({ error: "No users found in the database" }, { status: 404 });
    }
    
    // Process each user
    const results = [];
    
    for (const userData of users) {
      console.log(`Processing user: ${userData.id}`);
      
      // Get the user's supply chains
      const { data: supplyChains, error: supplyChainError } = await supabase
        .from('supply_chains')
        .select('*')
        .eq('user_id', userData.id);
      
      if (supplyChainError) {
        console.error(`Error fetching supply chains for user ${userData.id}:`, supplyChainError);
        continue; // Skip this user and continue with the next one
      }
      
      if (!supplyChains || supplyChains.length === 0) {
        console.log(`No supply chains found for user ${userData.id}, skipping...`);
        continue; // Skip this user and continue with the next one
      }
      
      console.log(`Found ${supplyChains.length} supply chains for user ${userData.id}`);
      
      // Process each supply chain for the current user
      for (const supplyChain of supplyChains) {
        console.log(`Processing supply chain: ${supplyChain.supply_chain_id}`);
        
        // Generate intelligence for this supply chain
        const supplyChainResults = await getAllNodeIntel(supplyChain);
        
        // Store the results in the database
        console.log(`Storing intelligence data for supply chain ${supplyChain.supply_chain_id}...`);
        await storeSupplyChainIntel(
          userData.id,
          supplyChain.supply_chain_id,
          supplyChainResults as NodeIntel[]
        );
        
        // Add to the results array
        results.push({
          user_id: userData.id,
          supply_chain_id: supplyChain.supply_chain_id,
          results: supplyChainResults
        });
        
        console.log(`Intelligence data stored successfully for supply chain ${supplyChain.supply_chain_id}`);
      }
    }
    
    console.log(`Processed intelligence data for ${results.length} supply chains`);
    return NextResponse.json({ results });
  } catch (error) {
    console.error("AI agent error:", error);
    return NextResponse.json({ error: "Failed to gather supply chain intel", details: (error instanceof Error ? error.message : "Unknown error") }, { status: 500 });
   }
}
