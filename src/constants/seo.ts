export const SEO_DEFAULTS = {
  SITE_NAME: 'Bhekani.com',
  DEFAULT_DESCRIPTION: 'Bhekani Khumalo, software engineer in London working on AI and distributed systems. Writing about software, building products, and life outside tech.',
  DEFAULT_OG_IMAGE_URL: 'https://www.bhekani.com/og/homepage.png',
  OG_IMAGE_WIDTH: 1200,
  OG_IMAGE_HEIGHT: 630,
  TWITTER_HANDLE: '@bhekanik',
} as const

export const SITE_ORIGIN = "https://www.bhekani.com"

/** RSS GUIDs published before the canonical-origin repair are subscriber IDs. */
export const LEGACY_RSS_GUID_ORIGIN = "https://bhekani.com"

export const getSiteUrl = (path: string): string => new URL(path, SITE_ORIGIN).toString()

export const getDocumentTitle = (pageTitle: string): string =>
  `${pageTitle} | ${SEO_DEFAULTS.SITE_NAME}`
