
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

async function listTables() {
  console.log('--- Listing Database Tables ---');
  
  // We can query the information_schema to see all tables in public
  const { data, error } = await supabase.rpc('get_tables');
  
  if (error) {
    console.log('RPC get_tables failed (expected if not defined). Trying raw query...');
    // Fallback: try to select from a non-existent table to see if the error message lists available tables in some contexts,
    // or better, use a query that at least checks for common tables.
    
    const commonTables = [
      'supply_chains', 'nodes', 'edges', 'forecasts', 'simulations', 
      'impact_results', 'users', 'profiles', 'ai_suggestions'
    ];
    
    for (const table of commonTables) {
      const { error: tError } = await supabase.from(table).select('*', { count: 'exact', head: true }).limit(0);
      if (tError) {
        if (tError.code === '42P01') {
          console.log(`Table '${table}' does NOT exist.`);
        } else {
          console.log(`Table '${table}' exists but returned error: ${tError.message}`);
        }
      } else {
        console.log(`Table '${table}' EXISTS.`);
      }
    }
  } else {
    console.log('Tables:', data);
  }
}

listTables();
