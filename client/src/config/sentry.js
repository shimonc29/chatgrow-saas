import * as Sentry from '@sentry/react';

/**
 * Initialize Sentry for React app
 * Only active when VITE_SENTRY_DSN is configured
 */
export function initializeSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;

  if (!dsn) {
    console.warn('Sentry DSN not configured - error tracking disabled');
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE || 'development',
    tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,

    integrations: [
      new Sentry.BrowserTracing(),
      new Sentry.Replay({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    // Session Replay sample rate
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Filter out sensitive data
    beforeSend(event) {
      // Remove sensitive data from event
      if (event.request?.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers.cookie;
      }

      // Remove passwords and tokens from form data
      if (event.request?.data) {
        const sensitiveFields = ['password', 'token', 'apiKey', 'secret'];
        sensitiveFields.forEach(field => {
          if (event.request.data[field]) {
            event.request.data[field] = '[REDACTED]';
          }
        });
      }

      return event;
    },
  });

  console.warn('Sentry initialized for React app');
}

/**
 * Capture exception manually
 */
export function captureException(error, context = {}) {
  if (!import.meta.env.VITE_SENTRY_DSN) {
    return;
  }

  Sentry.captureException(error, {
    contexts: {
      custom: context,
    },
  });
}

/**
 * Capture message manually
 */
export function captureMessage(message, level = 'info', context = {}) {
  if (!import.meta.env.VITE_SENTRY_DSN) {
    return;
  }

  Sentry.captureMessage(message, {
    level,
    contexts: {
      custom: context,
    },
  });
}

export { Sentry };
