import { OGImageRoute } from "astro-og-canvas"
import { getHomepageOgOptions } from "../../constants/og-image"

export const { getStaticPaths, GET } = await OGImageRoute({
  pages: {
    homepage: { title: "Bhekani Khumalo" },
  },
  param: "route",

  getImageOptions: () => getHomepageOgOptions(),
})
