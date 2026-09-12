// Sentry instrumentation temporarily disabled to fix SSR issues.
// Re-enable when SENTRY_ORG/SENTRY_PROJECT env vars are configured.

export async function register() {
  // Patch Zod v3 to support .loose() which @google/adk calls at module evaluation time.
  // Must run here (before any route module) to prevent build crashes.
  // ADK assumes Zod v4 where .loose() exists; in Zod v3 the equivalent is .passthrough().
  try {
    const { z } = await import('zod');
    if (typeof (z.ZodObject.prototype as any).loose === 'undefined') {
      (z.ZodObject.prototype as any).loose = z.ZodObject.prototype.passthrough;
    }
  } catch (e) {
    // Zod not available in this runtime, skip
  }

  // Polyfill localStorage for server environment (Node.js doesn't have it)
  // This prevents packages like `nuqs` from crashing with
  // "localStorage.getItem is not a function" during SSR
  if (typeof globalThis.localStorage === 'undefined' || 
      typeof (globalThis.localStorage as any).getItem !== 'function') {
    const store: Record<string, string> = {};
    (globalThis as any).localStorage = {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => { store[key] = String(value); },
      removeItem: (key: string) => { delete store[key]; },
      clear: () => { Object.keys(store).forEach(k => delete store[k]); },
      key: (index: number) => Object.keys(store)[index] ?? null,
      get length() { return Object.keys(store).length; },
    };
  }

  // if (process.env.NEXT_RUNTIME === 'nodejs') {
  //   await import('./sentry.server.config');
  // }
  // if (process.env.NEXT_RUNTIME === 'edge') {
  //   await import('./sentry.edge.config');
  // }
}

// export const onRequestError = Sentry.captureRequestError;
