import db from "@astrojs/db";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import vercel from "@astrojs/vercel";
import sentry from "@sentry/astro";
import tailwindcss from "@tailwindcss/vite";
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
  vite: {
    plugins: [tailwindcss() as any]
  },
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
  }), db(), svelte()]
});