import { supabaseServer } from '@/lib/supabase/server';

/**
 * Audit action categories — each action is a high-level event, NOT a console log.
 * Examples:
 *   'agent_request'      → An agent was invoked (impact, strategy, forecast, etc.)
 *   'news_fetch'         → Tavily news fetch completed (batches all articles into one log)
 *   'threat_scan'        → Automated alerts agent completed a scan
 *   'supply_chain_saved' → User saved/created a supply chain
 *   'supply_chain_deleted' → User deleted a supply chain
 *   'node_added'         → User added a node
 *   'node_deleted'       → User deleted a node
 *   'simulation_created' → A simulation scenario was created
 *   'forecast_generated' → Forecast agent produced a result
 *   'strategy_generated' → Strategy agent produced a result
 *   'user_action'        → Generic user-driven action
 */

export interface AuditLogEntry {
  userId: string;
  action: string;
  details: {
    agent?: string;
    status: 'started' | 'success' | 'error';
    summary: string;
    metadata?: Record<string, any>;
  };
}

/**
 * Logs a single audit event to the `audit_logs` table.
 * This is fire-and-forget — it never throws, never blocks the main flow.
 */
export async function logAudit(entry: AuditLogEntry): Promise<void> {
  try {
    const safeUserId = entry.userId === 'system' ? null : entry.userId;
    await supabaseServer.from('audit_logs').insert({
      user_id: safeUserId,
      action: entry.action,
      details: entry.details,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    // Audit logging should never crash the main flow
    console.error('[AUDIT] Failed to write audit log:', err);
  }
}

/**
 * Helper for agent request/response logging.
 * Call `start()` before the agent runs, `end()` after with the result.
 */
export function agentAudit(agentName: string, userId: string) {
  return {
    start: (inputSummary: string) =>
      logAudit({
        userId,
        action: 'agent_request',
        details: {
          agent: agentName,
          status: 'started',
          summary: `Request sent to ${agentName}: ${inputSummary}`,
        },
      }),
    success: (resultSummary: string, metadata?: Record<string, any>) =>
      logAudit({
        userId,
        action: 'agent_request',
        details: {
          agent: agentName,
          status: 'success',
          summary: resultSummary,
          metadata,
        },
      }),
    error: (errorMessage: string) =>
      logAudit({
        userId,
        action: 'agent_request',
        details: {
          agent: agentName,
          status: 'error',
          summary: `Error from ${agentName}: ${errorMessage}`,
        },
      }),
  };
}
