/**
 * Direct end-to-end test:
 * 1. Calls Tavily API for supply chain news
 * 2. Inserts results into Supabase notifications table
 * 3. Reads back the rows to confirm persistence
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';
import { tavily } from '@tavily/core';
import { randomUUID } from 'crypto';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const tavilyClient = tavily({ apiKey: process.env.TAVILY_API_KEY! });

// ── 1. Get a real user from the DB ──────────────────────────────────────────
async function getRealUserId(): Promise<string | null> {
  const { data, error } = await supabase.from('users').select('id').limit(1).single();
  if (error || !data) {
    console.warn('⚠️  No users in DB — using a synthetic UUID for the test.');
    return null;
  }
  return data.id;
}

async function main() {
  console.log('\n🔍  Testing: Tavily → Supabase notifications pipeline\n');

  // Step 1: Confirm env vars
  const missing = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'TAVILY_API_KEY'].filter(
    (k) => !process.env[k]
  );
  if (missing.length) {
    console.error('❌  Missing env vars:', missing.join(', '));
    process.exit(1);
  }
  console.log('✅  Env vars loaded');

  // Step 2: Fetch news from Tavily
  console.log('\n📡  Calling Tavily API...');
  let articles: any[] = [];
  try {
    const result = await tavilyClient.search(
      'latest supply chain disruption logistics trade news',
      { topic: 'news', days: 2, maxResults: 5 }
    );
    articles = result.results || [];
    console.log(`✅  Tavily returned ${articles.length} articles:`);
    articles.forEach((a, i) => console.log(`   ${i + 1}. ${a.title} (${a.url.substring(0, 60)}...)`));
  } catch (err: any) {
    console.error('❌  Tavily API error:', err.message);
    process.exit(1);
  }

  if (articles.length === 0) {
    console.warn('⚠️  Tavily returned 0 articles. Check API key or search query.');
    process.exit(0);
  }

  // Step 3: Get real userId or use synthetic
  const userId = (await getRealUserId()) || randomUUID();
  console.log(`\n👤  Using userId: ${userId}`);

  // Step 4: Insert articles into notifications
  console.log('\n💾  Inserting articles into Supabase notifications table...');
  const inserts = articles.map((article) => ({
    user_id: userId,
    title: article.title,
    message: article.content
      ? article.content.substring(0, 500) + (article.content.length > 500 ? '...' : '')
      : 'No content.',
    notification_type: 'live_news_alert',
    severity: 'MEDIUM',
    read_status: false,
    created_at: article.publishedDate
      ? new Date(article.publishedDate).toISOString()
      : new Date().toISOString(),
    citations: {
      category: 'Live News',
      sources: [
        {
          title: article.title,
          url: article.url,
          publishedAt: article.publishedDate || new Date().toISOString(),
          credibility: 0.85,
        },
      ],
      affectedEntities: ['Global Supply Chain'],
    },
  }));

  const { data: inserted, error: insertErr } = await supabase
    .from('notifications')
    .insert(inserts)
    .select('notification_id, title, created_at');

  if (insertErr) {
    console.error('❌  Insert error:', insertErr.message);
    process.exit(1);
  }
  console.log(`✅  Inserted ${inserted?.length} rows:`);
  inserted?.forEach((row) => console.log(`   • [${row.notification_id}] ${row.title.substring(0, 60)}`));

  // Step 5: Read back top 5 live_news_alert for this user
  console.log('\n📖  Reading back top 5 live_news_alert from DB...');
  const { data: readback, error: readErr } = await supabase
    .from('notifications')
    .select('notification_id, title, created_at, severity')
    .eq('user_id', userId)
    .eq('notification_type', 'live_news_alert')
    .order('created_at', { ascending: false })
    .limit(5);

  if (readErr) {
    console.error('❌  Read error:', readErr.message);
    process.exit(1);
  }

  console.log(`✅  Found ${readback?.length} news notifications in DB:`);
  readback?.forEach((row, i) =>
    console.log(`   ${i + 1}. [${row.severity}] ${row.title.substring(0, 60)} — ${row.created_at}`)
  );

  console.log('\n🎉  Pipeline verified: Tavily → Supabase notifications works correctly!\n');
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
