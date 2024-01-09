import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";
import vercel from "@astrojs/vercel/serverless";
import sentry from "@sentry/astro";
import robotsTxt from "astro-robots-txt";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  site: "https://bhekani.com",
  output: "hybrid",
  adapter: vercel(),
  integrations: [
    sitemap(),
    robotsTxt(),
    mdx(),
    sentry({
      dsn: "https://c8fc23d45a17004cddf52ecfee998bf2@o1115887.ingest.sentry.io/4506532148936704",
      sourceMapsUploadOptions: {
        project: "website",
        authToken: process.env.SENTRY_AUTH_TOKEN,
        environment:
          process.env.NODE_ENV === "production" ? "production" : "development",
      },
    }),
    tailwind(),
  ],
});
