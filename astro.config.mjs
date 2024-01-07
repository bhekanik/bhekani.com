import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";
import vercel from "@astrojs/vercel/serverless";
import { defineConfig } from "astro/config";

import robotsTxt from "astro-robots-txt";

// https://astro.build/config
export default defineConfig({
  site: "https://bhekani.com",
  output: "hybrid",
  adapter: vercel(),
  integrations: [tailwind(), sitemap(), robotsTxt(), mdx()],
});
