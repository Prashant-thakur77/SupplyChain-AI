
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

async function checkData() {
  console.log('--- Database Status ---');
  
  const tables = ['supply_chains', 'nodes', 'edges', 'forecasts', 'users'];
  
  for (const table of tables) {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
    if (error) {
      console.error(`Error checking ${table}:`, error.message);
    } else {
      console.log(`Table ${table}: ${count} rows`);
    }
  }

  // Check last 5 forecasts
  const { data: lastForecasts, error: fError } = await supabase
    .from('forecasts')
    .select('created_at, supply_chain_id, node_id, risk_score')
    .order('created_at', { ascending: false })
    .limit(5);
    
  if (fError) {
    console.error('Error fetching forecasts:', fError.message);
  } else {
    console.log('Last 5 forecasts:', lastForecasts);
  }
}

checkData();
