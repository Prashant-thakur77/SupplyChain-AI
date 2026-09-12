import { tavily } from '@tavily/core';
import readline from 'readline';

// Configuration
const API_KEY = process.env.TAVILY_API_KEY;
const POLL_INTERVAL = 5000; // 5 seconds (continuous fetching)
const SEARCH_QUERY = 'latest world news and supply chain disruptions';

const client = tavily({ apiKey: API_KEY });

async function fetchNews() {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`\n\x1b[36m[${timestamp}] Fetching latest news...\x1b[0m`);

  try {
    const response = await client.search(SEARCH_QUERY, {
      topic: 'news',
      days: 1,
      maxResults: 5,
    });

    if (response.results && response.results.length > 0) {
      response.results.forEach((result, index) => {
        console.log(`\n\x1b[1m${index + 1}. ${result.title}\x1b[0m`);
        console.log(`   \x1b[90mSource: ${result.url}\x1b[0m`);
        if (result.publishedDate) {
          console.log(`   \x1b[33mDate: ${result.publishedDate}\x1b[0m`);
        }
        // Extract a short snippet
        const snippet = result.content.substring(0, 150).replace(/\n/g, ' ') + '...';
        console.log(`   ${snippet}`);
      });
    } else {
      console.log('\x1b[31mNo new articles found at this moment.\x1b[0m');
    }
  } catch (error) {
    console.error('\x1b[31mError fetching news:\x1b[0m', error.message);
  }

  console.log(`\n\x1b[90mNext update in ${POLL_INTERVAL / 1000}s. Press Ctrl+C to stop.\x1b[0m`);
}

console.clear();
console.log('\x1b[1m\x1b[32m=== LIVE NEWS FEED (Tavily API) ===\x1b[0m');
console.log(`Query: "${SEARCH_QUERY}"`);

// Initial fetch
fetchNews();

// Setup loop
const interval = setInterval(fetchNews, POLL_INTERVAL);

// Handle clean exit
process.on('SIGINT', () => {
  clearInterval(interval);
  console.log('\n\x1b[32mStopping live feed. Goodbye!\x1b[0m');
  process.exit();
});
