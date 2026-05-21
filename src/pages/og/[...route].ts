import { getHomepageOgOptions } from "../../constants/og-image"
import { createOgImageRoute } from "../../utils/og"

export const { getStaticPaths, GET } = await createOgImageRoute({
  pages: {
    homepage: { title: "Bhekani Khumalo" },
  },
  param: "route",

  getImageOptions: () => getHomepageOgOptions(),
})
