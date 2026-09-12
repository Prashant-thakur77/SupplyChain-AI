
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

async function testEdgeFunction() {
  console.log('Testing Edge Function: bright-processor');
  
  const dummyData = {
    name: "Test Supply Chain",
    description: "Testing edge function",
    timestamp: new Date().toISOString(),
    organisation: { id: "test-org" },
    nodes: [{ id: "test-node", data: { label: "Test Node" } }],
    edges: []
  };

  try {
    const { data, error } = await supabase.functions.invoke('bright-processor', {
      body: dummyData
    });

    if (error) {
      console.error('Edge function error:', error);
    } else {
      console.log('Edge function success:', data);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

testEdgeFunction();
