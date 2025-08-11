import db from "@astrojs/db";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";
import vercel from "@astrojs/vercel";
import sentry from "@sentry/astro";
import expressiveCode from "astro-expressive-code";
import robotsTxt from "astro-robots-txt";
import { defineConfig } from "astro/config";
import svelte from "@astrojs/svelte";
const isProduction = process.env.NODE_ENV === "production";


// https://astro.build/config
export default defineConfig({
  site: "https://bhekani.com",
  output: "static",
  adapter: vercel(),
  integrations: [sitemap(), robotsTxt(), expressiveCode({
    themes: ["one-dark-pro"],
    defaultProps: {
      // Enable word wrap by default
      wrap: true
    }
  }), mdx(), sentry({
    enabled: isProduction,
    sourceMapsUploadOptions: {
      project: "website",
      authToken: process.env.SENTRY_AUTH_TOKEN
    }
  }), tailwind(), db(), svelte()]
});