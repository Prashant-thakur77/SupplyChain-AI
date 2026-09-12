import { useCopilotAction } from "@copilotkit/react-core";
import { ActionContext } from './types';

export const useSearchActions = ({ panelId }: ActionContext) => {
  useCopilotAction({
    name: `search_web_${panelId}`,
    description: "Search the web for information using Tavily API.",
    parameters: [
      {
        name: "query",
        type: "string",
        description: "The search query to find information about."
      }
    ],
    handler: async ({ query }) => {
      try {
        const response = await fetch('/api/search', {
          method: 'POST',
          body: JSON.stringify({ query }),
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            const errorMessage = errorData.error || `Request failed with status ${response.status}`;
            return `An error occurred during the search: ${errorMessage}`;
        }

        const searchResult = await response.json();
        
        if (searchResult.answer) {
          return {
            type: 'answer',
            query,
            answer: searchResult.answer
          };
        }

        if (searchResult.results && searchResult.results.length > 0) {
          return {
            type: 'results',
            query,
            results: searchResult.results.slice(0, 5) // Limit to top 5 results
          };
        }
        
        return {
          type: 'no_results',
          query
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          type: 'error',
          query,
          error: message
        };
      }
    },
    render: ({ status, args, result }) => {
      console.log(`[Search Action ${panelId}] Render status:`, status, 'args:', args, 'result:', result);
      
      if (status === 'inProgress') {
        console.log(`[Search Action ${panelId}] Rendering in progress state`);
        const markdownOutput = `🔍 Preparing to search...`;
        console.log('CopilotAction generated markdown:', markdownOutput);
        return markdownOutput;
      }
      
      if (status === 'executing') {
        console.log(`[Search Action ${panelId}] Rendering executing state for query:`, args.query);
        const markdownOutput = `<web_search type="loading" query="${args.query}">Searching the web...</web_search>`;
        console.log('CopilotAction generated markdown:', markdownOutput);
        return markdownOutput;
      }
      
      if (status === 'complete' && result) {
        console.log(`[Search Action ${panelId}] Rendering complete state with result type:`, result.type);
        
        if (result.type === 'error') {
          console.log(`[Search Action ${panelId}] Rendering error state:`, result.error);
          const markdownOutput = `<web_search type="error" query="${result.query}" error="${result.error}">Search failed</web_search>`;
          console.log('CopilotAction generated markdown:', markdownOutput);
          return markdownOutput;
        }
        
        if (result.type === 'no_results') {
          console.log(`[Search Action ${panelId}] Rendering no results state`);
          const markdownOutput = `<web_search type="no_results" query="${result.query}">No results found</web_search>`;
          console.log('CopilotAction generated markdown:', markdownOutput);
          return markdownOutput;
        }
        
        if (result.type === 'answer') {
          console.log(`[Search Action ${panelId}] Rendering answer state`);
          const markdownOutput = `<web_search type="answer" query="${result.query}" answer="${result.answer}">Found answer</web_search>`;
          console.log('CopilotAction generated markdown:', markdownOutput);
          return markdownOutput;
        }
        
        if (result.type === 'results') {
          console.log(`[Search Action ${panelId}] Rendering results state with ${result.results.length} results`);
          const resultsJson = JSON.stringify(result.results).replace(/"/g, '&quot;');
          const markdownOutput = `<web_search type="results" query="${result.query}" results="${resultsJson}">Search results found</web_search>`;
          console.log('CopilotAction generated markdown:', markdownOutput);
          return markdownOutput;
        }
      }
      
      console.log(`[Search Action ${panelId}] Rendering default completion state`);
      const markdownOutput = 'Search completed.';
      console.log('CopilotAction generated markdown:', markdownOutput);
      return markdownOutput;
    }
  });
}; 