import { NextRequest, NextResponse } from 'next/server';
import { getTavilyClient } from '@/lib/clients/tavily';

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const searchResult = await getTavilyClient().search(query, {
      searchDepth: "advanced",
      includeAnswer: true,
      maxResults: 5,
    });

    return NextResponse.json(searchResult);
  } catch (error) {
    console.error('Search API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to perform search', details: errorMessage }, { status: 500 });
  }
} 