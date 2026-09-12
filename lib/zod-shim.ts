import * as z from 'zod';

// Re-export everything from the base zod package
export * from 'zod';

/**
 * MCP SDK expects z.iso.datetime() which is not standard in Zod.
 * This shim adds the missing property to satisfy the SDK's internal types.
 */
export const iso = {
  datetime: (params?: any) => z.string().datetime(params),
};

// Add other potential missing sub-properties if needed
// export const custom = z.custom;
