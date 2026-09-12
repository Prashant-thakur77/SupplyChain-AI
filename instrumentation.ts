// Sentry instrumentation temporarily disabled to fix SSR issues.
// Re-enable when SENTRY_ORG/SENTRY_PROJECT env vars are configured.

export async function register() {
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
