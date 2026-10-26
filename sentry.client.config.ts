import * as Sentry from "@sentry/astro";
import { initializeSentry } from "./src/utils/sentryClientConfig"

initializeSentry(Sentry, {
  dsn: import.meta.env.SENTRY_DSN,
  environment: process.env.NODE_ENV === "production" ? "production" : "development",
});
