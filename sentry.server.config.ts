// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Enhanced integrations for server-side monitoring
  integrations: [
    Sentry.httpIntegration(),
  ],

  // Add context for API routes and server errors
  beforeSend(event, hint) {
    // Log server-side errors for debugging
    if (event.exception && process.env.NODE_ENV === 'development') {
      console.log('Server-side Sentry captured error:', hint.originalException);
    }
    return event;
  },

  // Tag all server events
  initialScope: {
    tags: {
      component: "supply-chain-server"
    }
  }
});
