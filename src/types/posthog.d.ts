interface PostHogConfig {
  api_host?: string
  person_profiles?: 'identified_only' | 'always' | 'never'
  autocapture?: boolean
  capture_pageview?: boolean
  capture_pageleave?: boolean
  cross_subdomain_cookie?: boolean
  persistence?: 'localStorage' | 'cookie' | 'memory'
  disable_session_recording?: boolean
  mask_all_text?: boolean
  mask_all_element_attributes?: boolean
  [key: string]: unknown
}

interface PostHogProperties {
  [key: string]: string | number | boolean | null | undefined | PostHogProperties | PostHogProperties[]
}

interface PostHogCore {
  init: (token: string, config?: PostHogConfig) => void
  capture: (event: string, properties?: PostHogProperties) => void
  identify: (distinctId: string, properties?: PostHogProperties) => void
  reset: () => void
  register: (properties: PostHogProperties) => void
  register_once: (properties: PostHogProperties) => void
  unregister: (property: string) => void
  get_distinct_id: () => string
  alias: (alias: string) => void
  set_config: (config: Partial<PostHogConfig>) => void
  opt_in_capturing: () => void
  opt_out_capturing: () => void
  has_opted_in_capturing: () => boolean
  has_opted_out_capturing: () => boolean
  clear_opt_in_out_capturing: () => void
  debug: (enabled?: boolean) => void
  people?: {
    set: (properties: PostHogProperties) => void
    set_once: (properties: PostHogProperties) => void
    increment: (property: string, by?: number) => void
    append: (property: string, value: unknown) => void
    union: (property: string, values: unknown[]) => void
    remove: (property: string, value: unknown) => void
    unset: (property: string) => void
    delete_user: () => void
  }
}

/**
 * TODO: Consider migrating to @posthog/posthog-js npm package for better type safety
 * and automatic updates. This would eliminate the need for manual type definitions
 * and provide access to the full PostHog SDK with proper TypeScript support.
 */
declare global {
  interface Window {
    posthog?: PostHogCore & {
      _i?: unknown[]
      __SV?: number
      /**
       * Additional methods may be available at runtime.
       * Use type assertions when accessing undocumented methods.
       */
      [key: string]: unknown
    }
  }
}

export {}