import type { BrowserOptions } from "@sentry/browser"
import type { Integration } from "@sentry/core"

export interface SentryClientConfiguration {
  dsn: BrowserOptions["dsn"]
  environment: BrowserOptions["environment"]
}

export interface SentryClient {
  browserTracingIntegration: () => Integration
  init: (options: BrowserOptions) => void
}

export function initializeSentry(client: SentryClient, configuration: SentryClientConfiguration) {
  client.init({
    ...configuration,
    integrations: [client.browserTracingIntegration()],
    tracesSampleRate: configuration.environment === "production" ? 0.1 : 1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
  })
}
