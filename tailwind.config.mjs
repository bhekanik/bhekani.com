import defaultTheme from "tailwindcss/defaultTheme";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      fontFamily: {
        logo: ["IBM Plex Sans", ...defaultTheme.fontFamily.sans],
        headings: ["IBM Plex Sans", ...defaultTheme.fontFamily.sans],
        body: ["IBM Plex Sans", ...defaultTheme.fontFamily.sans],
        code: ["JetBrains Mono", ...defaultTheme.fontFamily.sans],
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
