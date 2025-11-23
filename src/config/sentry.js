const Sentry = require('@sentry/node');
const { logInfo, logWarning } = require('../utils/logger');

/**
 * Initialize Sentry for error tracking
 * Only active in production when SENTRY_DSN is configured
 */
function initializeSentry(app) {
  const dsn = process.env.SENTRY_DSN;

  if (!dsn) {
    logWarning('Sentry DSN not configured - error tracking disabled');
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Capture breadcrumbs
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express({ app }),
      new Sentry.Integrations.Mongo(),
    ],

    // Filter out sensitive data
    beforeSend(event) {
      // Remove sensitive headers
      if (event.request?.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers['x-api-key'];
        delete event.request.headers.cookie;
      }

      // Remove sensitive body fields
      if (event.request?.data) {
        const sensitiveFields = ['password', 'apiKey', 'token', 'secret'];
        sensitiveFields.forEach(field => {
          if (event.request.data[field]) {
            event.request.data[field] = '[REDACTED]';
          }
        });
      }

      return event;
    },
  });

  logInfo('Sentry initialized', {
    environment: process.env.NODE_ENV,
    dsn: dsn.substring(0, 20) + '...',
  });
}

/**
 * Get Sentry request handler middleware
 */
function getSentryRequestHandler() {
  if (!process.env.SENTRY_DSN) {
    return (req, res, next) => next();
  }
  return Sentry.Handlers.requestHandler();
}

/**
 * Get Sentry tracing middleware
 */
function getSentryTracingHandler() {
  if (!process.env.SENTRY_DSN) {
    return (req, res, next) => next();
  }
  return Sentry.Handlers.tracingHandler();
}

/**
 * Get Sentry error handler middleware
 */
function getSentryErrorHandler() {
  if (!process.env.SENTRY_DSN) {
    return (err, req, res, next) => next(err);
  }
  return Sentry.Handlers.errorHandler();
}

/**
 * Capture exception manually
 */
function captureException(error, context = {}) {
  if (!process.env.SENTRY_DSN) {
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
function captureMessage(message, level = 'info', context = {}) {
  if (!process.env.SENTRY_DSN) {
    return;
  }

  Sentry.captureMessage(message, {
    level,
    contexts: {
      custom: context,
    },
  });
}

module.exports = {
  initializeSentry,
  getSentryRequestHandler,
  getSentryTracingHandler,
  getSentryErrorHandler,
  captureException,
  captureMessage,
};
