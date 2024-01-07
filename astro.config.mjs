import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";
import vercel from "@astrojs/vercel/serverless";
import robotsTxt from "astro-robots-txt";
import { defineConfig } from "astro/config";

import sentry from "@sentry/astro";

// https://astro.build/config
export default defineConfig({
  site: "https://bhekani.com",
  output: "hybrid",
  adapter: vercel(),
  integrations: [
    tailwind(),
    sitemap(),
    robotsTxt(),
    mdx(),
    sentry({
      dsn: "https://9a6637668c0f45810a75491fe541581e@o1115887.ingest.sentry.io/4506531356672000",
      sourceMapsUploadOptions: {
        project: "bhekani-com",
        authToken: process.env.SENTRY_AUTH_TOKEN,
        environment:
          process.env.NODE_ENV === "production" ? "production" : "development",
      },
    }),
  ],
});
