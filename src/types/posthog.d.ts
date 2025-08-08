declare global {
  interface Window {
    posthog?: {
      init: (token: string, config?: Record<string, any>) => void
      capture: (event: string, properties?: Record<string, any>) => void
      identify: (distinctId: string, properties?: Record<string, any>) => void
      reset: () => void
      [key: string]: any
    }
  }
}

export {}