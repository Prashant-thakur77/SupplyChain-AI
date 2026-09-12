import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { supabaseServer } from '../../supabase/server';

const server = new Server({
  name: "supabase-mcp",
  version: "1.0.0"
}, {
  capabilities: {
    tools: {}
  }
});

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "supabase_read",
        description: "Read data from Supabase tables",
        inputSchema: {
          type: "object",
          properties: {
            table: { type: "string" },
            query: { type: "object", description: "Query object with eq, match, etc." }
          },
          required: ["table"]
        }
      },
      {
        name: "supabase_write",
        description: "Write data to Supabase tables",
        inputSchema: {
          type: "object",
          properties: {
            table: { type: "string" },
            data: { type: "object", description: "Data to insert or update" }
          },
          required: ["table", "data"]
        }
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  if (name === "supabase_read") {
    const { table, query } = args as any;
    try {
      let sbQuery = supabaseServer.from(table).select('*');
      if (query && query.eq) {
        for (const [k, v] of Object.entries(query.eq)) {
          sbQuery = sbQuery.eq(k, v);
        }
      }
      const { data, error } = await sbQuery;
      if (error) throw error;
      return { content: [{ type: "text", text: JSON.stringify(data) }] };
    } catch (e: any) {
      return { isError: true, content: [{ type: "text", text: e.message }] };
    }
  }

  if (name === "supabase_write") {
    const { table, data } = args as any;
    try {
      const { data: result, error } = await supabaseServer.from(table).insert(data);
      if (error) throw error;
      return { content: [{ type: "text", text: JSON.stringify(result || { success: true }) }] };
    } catch (e: any) {
      return { isError: true, content: [{ type: "text", text: e.message }] };
    }
  }

  throw new Error(`Tool not found: ${name}`);
});

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log("Supabase MCP server running on stdio");
}

if (require.main === module) {
  runServer().catch(console.error);
}

export { server, runServer };
