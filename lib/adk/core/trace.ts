import { supabaseServer } from '../../supabase/server';
import { AgentResult } from '../types';

export async function withTrace<T>(
  sessionId: string,
  agentName: string,
  fn: () => Promise<AgentResult<T>>
): Promise<AgentResult<T>> {
  const start = Date.now();
  const trace = { session_id: sessionId, agent_name: agentName, started_at: new Date().toISOString() };
  
  try {
    const result = await fn();
    
    // Fire and forget trace insertion
    supabaseServer.from('agent_traces').insert({
      ...trace,
      ended_at: new Date().toISOString(),
      duration_ms: Date.now() - start,
      success: result.success,
      error: result.error
    }).then(({ error }) => {
      if (error) console.error(`[Trace] Failed to save trace for ${agentName}:`, error.message);
    });

    return result;
  } catch (err: any) {
    supabaseServer.from('agent_traces').insert({
      ...trace,
      ended_at: new Date().toISOString(),
      duration_ms: Date.now() - start,
      success: false,
      error: String(err.message || err)
    }).then(({ error }) => {
      if (error) console.error(`[Trace] Failed to save error trace for ${agentName}:`, error.message);
    });

    return {
      success: false,
      error: String(err.message || err)
    };
  }
}
