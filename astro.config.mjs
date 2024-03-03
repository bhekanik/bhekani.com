import mdx from "@astrojs/mdx"
import sitemap from "@astrojs/sitemap"
import tailwind from "@astrojs/tailwind"
import vercel from "@astrojs/vercel/serverless"
import sentry from "@sentry/astro"
import expressiveCode from "astro-expressive-code"
import robotsTxt from "astro-robots-txt"
import { defineConfig } from "astro/config"
const isProduction = process.env.NODE_ENV === "production"

// https://astro.build/config
export default defineConfig({
  site: "https://bhekani.com",
  output: "hybrid",
  adapter: vercel(),
  integrations: [
    sitemap(),
    robotsTxt(),
    expressiveCode({
      themes: ["one-dark-pro"],
      defaultProps: {
        // Enable word wrap by default
        wrap: true,
      },
    }),
    mdx(),
    sentry({
      dsn: "https://c8fc23d45a17004cddf52ecfee998bf2@o1115887.ingest.sentry.io/4506532148936704",
      enabled: isProduction,
      environment: isProduction ? "production" : "development",
      sourceMapsUploadOptions: {
        project: "website",
        authToken: process.env.SENTRY_AUTH_TOKEN,
        environment: isProduction ? "production" : "development",
      },
    }),
    tailwind(),
  ],
})
