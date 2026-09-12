
import { saveSupplyChainAction } from './lib/actions/edge-functions';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

async function verifySave() {
  const supplyChainId = 'test-sc-' + Date.now();
  console.log('Verifying save action with ID:', supplyChainId);

  const mockData = {
    id: supplyChainId,
    name: "Verification Test",
    description: "Testing direct DB persistence",
    timestamp: new Date().toISOString(),
    organisation: { id: "test-org", name: "Test Org" },
    nodes: [
      { 
        id: "node-1", 
        type: "supplier", 
        data: { label: "Supplier A", type: "Supplier", capacity: 500 },
        position: { x: 100, y: 100 }
      },
      { 
        id: "node-2", 
        type: "factory", 
        data: { label: "Factory B", type: "Factory", capacity: 200 },
        position: { x: 300, y: 100 }
      }
    ],
    edges: [
      { id: "edge-1", source: "node-1", target: "node-2", data: { mode: "truck" } }
    ]
  };

  try {
    const result = await saveSupplyChainAction(mockData);
    console.log('Action Result:', result);

    if (result.error) {
      console.error('Action reported error:', result.error);
      return;
    }

    // Verify in DB
    const { data: sc, error: scErr } = await supabase.from('supply_chains').select('*').eq('supply_chain_id', supplyChainId).single();
    const { data: nodes, error: nErr } = await supabase.from('nodes').select('*').eq('supply_chain_id', supplyChainId);
    const { data: edges, error: eErr } = await supabase.from('edges').select('*').eq('supply_chain_id', supplyChainId);

    console.log('--- DB Verification ---');
    console.log('Supply Chain found:', !!sc, sc?.name);
    console.log('Nodes found:', nodes?.length);
    console.log('Edges found:', edges?.length);

    if (sc && nodes?.length === 2 && edges?.length === 1) {
      console.log(' VERIFICATION SUCCESSFUL');
    } else {
      console.error(' VERIFICATION FAILED');
    }
  } catch (err) {
    console.error('Unexpected error during verification:', err);
  }
}

verifySave();
