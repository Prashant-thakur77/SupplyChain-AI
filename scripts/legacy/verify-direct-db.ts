import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { randomUUID } from 'crypto';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

async function verifyDirectSave() {
  const supplyChainId = randomUUID();
  console.log('Verifying direct DB insertion with ID:', supplyChainId);

  try {
    // 1. Insert Supply Chain
    const { data: sc, error: scErr } = await supabase.from('supply_chains').insert({
      supply_chain_id: supplyChainId,
      name: "Direct Persistence Test",
      description: "Testing direct table access",
      organisation: { id: "test-org" },
      timestamp: new Date().toISOString()
    }).select().single();

    if (scErr) throw scErr;
    console.log(' Supply Chain inserted');

    // 2. Insert Node
    const nodeId = randomUUID();
    const { error: nErr } = await supabase.from('nodes').insert({
      node_id: nodeId,
      supply_chain_id: supplyChainId,
      name: "Test Node",
      type: "Supplier",
      description: "Direct insert test node",
      data: { label: "Test Node" },
      capacity: 100,
      risk_level: 10
    });

    if (nErr) throw nErr;
    console.log(' Node inserted');

    // 3. Insert Edge
    const { error: eErr } = await supabase.from('edges').insert({
      edge_id: randomUUID(),
      supply_chain_id: supplyChainId,
      from_node_id: nodeId,
      to_node_id: nodeId, // Self-loop for test
      type: "default",
      data: { mode: "test" }
    });

    if (eErr) throw eErr;
    console.log(' Edge inserted');

    console.log('--- Verification Summary ---');
    const { count: scCount } = await supabase.from('supply_chains').select('*', { count: 'exact', head: true }).eq('supply_chain_id', supplyChainId);
    const { count: nCount } = await supabase.from('nodes').select('*', { count: 'exact', head: true }).eq('supply_chain_id', supplyChainId);
    const { count: eCount } = await supabase.from('edges').select('*', { count: 'exact', head: true }).eq('supply_chain_id', supplyChainId);

    console.log(`SC: ${scCount}, Nodes: ${nCount}, Edges: ${eCount}`);

    if (scCount === 1 && nCount === 1 && eCount === 1) {
      console.log(' DIRECT PERSISTENCE VERIFIED');
    } else {
      console.error('VERIFICATION FAILED: Counts mismatch');
    }
  } catch (err: any) {
    console.error('Unexpected error:', err.message || err);
  }
}

verifyDirectSave();
