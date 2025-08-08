import * as Sentry from "@sentry/astro";

Sentry.init({
  dsn: import.meta.env.SENTRY_DSN,
  environment: process.env.NODE_ENV === "production" ? "production" : "development",
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
});