import { supabaseServer } from '../../supabase/server';
import { SupplyChainSessionState } from '../types';

export class SessionManager {
  static async loadSession(sessionId: string): Promise<SupplyChainSessionState | null> {
    const { data, error } = await supabaseServer
      .from('sessions')
      .select('state')
      .eq('session_id', sessionId)
      .single();

    if (error || !data) {
      console.error(`[SessionManager] Failed to load session ${sessionId}:`, error?.message);
      return null;
    }

    return data.state as SupplyChainSessionState;
  }

  static async saveSession(sessionId: string, state: Partial<SupplyChainSessionState>): Promise<void> {
    const existing = await this.loadSession(sessionId) || {};
    const newState = { ...existing, ...state, lastUpdatedAt: new Date().toISOString() };

    const { error } = await supabaseServer
      .from('sessions')
      .upsert({
        session_id: sessionId,
        state: newState,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error(`[SessionManager] Failed to save session ${sessionId}:`, error.message);
    }
  }

  static createInitialState(params: { supplyChainId: string, userId: string, query: string, nodeId?: string }): SupplyChainSessionState {
    const now = new Date().toISOString();
    return {
      supplyChainId: params.supplyChainId,
      userId: params.userId,
      userQuery: params.query,
      nodeId: params.nodeId,
      forecastAvailable: true,
      scenariosAvailable: true,
      workflowStage: 'init',
      agentsInvoked: [],
      agentErrors: {},
      startedAt: now,
      lastUpdatedAt: now
    };
  }
}
