import * as Sentry from "@sentry/astro";

Sentry.init({
  dsn: import.meta.env.SENTRY_DSN,
  environment: process.env.NODE_ENV === "production" ? "production" : "development",
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});