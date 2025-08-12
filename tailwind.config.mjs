import defaultTheme from "tailwindcss/defaultTheme";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      fontFamily: {
        logo: ["Inter Variable", ...defaultTheme.fontFamily.sans],
        headings: ["Inter Variable", ...defaultTheme.fontFamily.sans],
        body: ["Inter Variable", ...defaultTheme.fontFamily.sans],
        code: ["JetBrains Mono", ...defaultTheme.fontFamily.sans],
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
