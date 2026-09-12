// This file configures the initialization of Sentry on the browser/client side.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN ,

  // Add optional integrations for additional features
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      // Session Replay configuration
      maskAllText: false, // Set to true in production for privacy
      maskAllInputs: true, // Always mask input fields for security
      blockAllMedia: false, // Set to true to block images/videos from replay
      
      // Configure what gets masked for privacy
      mask: [
        // Mask sensitive elements by CSS selector
        '.password-field',
        '.credit-card',
        '.ssn',
        '[data-sensitive]',
        '.api-key',
        '.token'
      ],
      
      // Block elements from being recorded entirely
      block: [
        '.sentry-block',
        '.private-content',
        '[data-private]'
      ]
    }),
    Sentry.feedbackIntegration({
      // Additional configuration goes here
      colorScheme: "system",
      autoInject: false,
    }),
  ],

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1,
  
  // Session Replay sampling rates
  replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 0.1, // 5% in prod, 10% in dev
  replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Add context for better debugging
  beforeSend(event, hint) {
    const error = hint.originalException;

    // ZodErrors are expected form validation errors handled internally by react-hook-form.
    // They are NOT application crashes. Suppressing them prevents false-positive noise.
    if (
      error instanceof Error &&
      (error.name === 'ZodError' || error.constructor?.name === 'ZodError')
    ) {
      return null; // Drop this event — do not send to Sentry
    }

    // Log in dev for debugging non-ZodErrors only
    if (event.exception && process.env.NODE_ENV === 'development') {
      console.log('Sentry captured error:', error);
    }
    return event;
  },

  // Tag all events with environment info
  initialScope: {
    tags: {
      component: "supply-chain-app"
    },
    level: "error"
  }
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;