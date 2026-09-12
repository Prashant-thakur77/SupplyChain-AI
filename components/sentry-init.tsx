"use client";

// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

// Only initialize Sentry on the client side
if (typeof window !== 'undefined') {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

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
      }),
    ],

    // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
   tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1,
    
    // Session Replay sampling rates
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,

    // Add context for better debugging
    beforeSend(event, hint) {
      // Add additional context
      if (event.exception) {
        const error = hint.originalException;
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
}

// Export a component that can be used in the layout
export default function SentryInit() {
  return null;
}
