"use server";

import { supabaseServer } from '@/lib/supabase/server';
import type { AuditLogEntry } from '@/lib/audit-logger';

export async function logAuditAction(entry: AuditLogEntry): Promise<void> {
  try {
    const safeUserId = entry.userId === 'system' ? null : entry.userId;
    await supabaseServer.from('audit_logs').insert({
      user_id: safeUserId,
      action: entry.action,
      details: entry.details,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[AUDIT] Failed to write audit log from client:', err);
  }
}
