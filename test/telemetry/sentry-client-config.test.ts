import { describe, expect, it, vi } from "vitest"
import { initializeSentry } from "../../src/utils/sentryClientConfig"

const init = vi.fn()
const browserTracingIntegration = vi.fn(() => ({ name: "BrowserTracing" }))

describe("Sentry browser initialization", () => {
  it("keeps basic tracing while disabling every replay start path", async () => {
    initializeSentry({ init, browserTracingIntegration }, { dsn: undefined, environment: "production" })

    expect(init).toHaveBeenCalledOnce()
    expect(init).toHaveBeenCalledWith(expect.objectContaining({
      integrations: [{ name: "BrowserTracing" }],
      tracesSampleRate: 0.1,
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 0,
    }))
  })
})
