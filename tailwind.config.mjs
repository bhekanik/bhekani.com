import defaultTheme from "tailwindcss/defaultTheme";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      fontFamily: {
        logo: ["Permanent Marker", ...defaultTheme.fontFamily.sans],
        headings: ["Abril Fatface", ...defaultTheme.fontFamily.sans],
        body: ["IBM Plex Sans", ...defaultTheme.fontFamily.sans],
        code: ["JetBrains Mono", ...defaultTheme.fontFamily.sans],
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
