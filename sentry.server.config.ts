import * as Sentry from "@sentry/astro";

Sentry.init({
  dsn: "https://c8fc23d45a17004cddf52ecfee998bf2@o1115887.ingest.sentry.io/4506532148936704",
  environment: process.env.NODE_ENV === "production" ? "production" : "development",
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
});