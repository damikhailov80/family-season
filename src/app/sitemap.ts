import type { MetadataRoute } from 'next'
import { EXAMPLE_LIST } from '../model/examples'
import { DEFAULT_LANG, LANGS, type Lang } from '../model/lang'
import { monthPage, monthSlugs } from '../model/months'
import { posterPages } from '../model/posters'
import { shortCode } from '../model/shortcode'
import { ROUTES, SITE_URL, withLang } from '../model/site'

const PAGES = [
  ROUTES.home,
  ROUTES.ideas,
  ROUTES.privacy,
  ROUTES.month,
  ...monthSlugs().map((slug) => `${ROUTES.month}/${slug}`),
]

const address = (path: string) => new URL(path, SITE_URL).href

// The pictures of our examples' sheets, for the image search: listed on the example itself and
// on the month page that shows it.
const pictures = (codes: string[]) =>
  codes.flatMap((code) => (posterPages(code) ?? []).map(address))

const monthPictures = (lang: Lang, path: string) => {
  const slug = path.startsWith(`${ROUTES.month}/`) ? path.slice(ROUTES.month.length + 1) : null
  const page = slug ? monthPage(lang, slug) : null
  return page ? pictures(page.seasons.map((season) => season.code)) : []
}

// People's publications are deliberately not listed: the map would then need the database, and
// a quiet database must not take a page down. Our own examples are a different matter - their
// codes come from the PUBLIC_IDS table, so the list is assembled without a single query.
//
// There is no lastModified anywhere here on purpose. Nothing on this site carries a date a
// page was changed, and a date computed at request time would say "just now" forever - which
// is worse than saying nothing.
export default function sitemap(): MetadataRoute.Sitemap {
  const translated = PAGES.flatMap((path) =>
    LANGS.map((lang: Lang) => ({
      url: address(withLang(lang, path)),
      alternates: {
        languages: {
          ...Object.fromEntries(LANGS.map((one) => [one, address(withLang(one, path))])),
          'x-default': address(withLang(DEFAULT_LANG, path)),
        },
      },
      images: monthPictures(lang, path),
    })),
  )

  // A publication lives only in its own language, so it gets no alternates - the same reason
  // its page is built with alternates: 'self'.
  const examples = EXAMPLE_LIST.map((example) => ({
    url: address(example.href),
    images: pictures([shortCode('public', example.publicId)]),
  }))

  return [...translated, ...examples]
}
