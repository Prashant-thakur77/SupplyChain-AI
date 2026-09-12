import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Fetch recent audit logs — we fetch both user-specific and system-level logs
    const { data: logs, error } = await supabaseServer
      .from('audit_logs')
      .select('*')
      .or(`user_id.eq.${userId},user_id.is.null`)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[AUDIT-API] Error fetching audit logs:', error.message);
      return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
    }

    return NextResponse.json({ logs: logs || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Internal error' }, { status: 500 });
  }
}
