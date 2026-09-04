import type { MetadataRoute } from 'next'
import { DEFAULT_LANG, LANGS, type Lang } from '../model/lang'
import { ROUTES, SITE_URL, withLang } from '../model/site'

const PAGES = [ROUTES.home, ROUTES.ideas, ROUTES.privacy]

// Published seasons are deliberately not listed: the map would then need the database, and a
// quiet database must not take a page down. The way into the showcase is /ideas.
export default function sitemap(): MetadataRoute.Sitemap {
  const address = (lang: Lang, path: string) => new URL(withLang(lang, path), SITE_URL).href

  return PAGES.flatMap((path) =>
    LANGS.map((lang) => ({
      url: address(lang, path),
      alternates: {
        languages: {
          ...Object.fromEntries(LANGS.map((one) => [one, address(one, path)])),
          'x-default': address(DEFAULT_LANG, path),
        },
      },
    })),
  )
}
