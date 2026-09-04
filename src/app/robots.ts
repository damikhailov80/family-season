import type { MetadataRoute } from 'next'
import { ROUTES, SITE_URL } from '../model/site'

const PRIVATE = [
  `${ROUTES.shared}/`,
  `${ROUTES.season}/`,
  ROUTES.seasons,
  ROUTES.account,
  ROUTES.sheet,
]

// Root-only convention, so it stands outside [lang]: the file is one for the whole site, and
// the paths inside it are the language-free ones from ROUTES - a rule per language would say
// the same thing three times.
//
// Every real address carries the language, and robots.txt matches from the root: a bare
// "/seasons" matched nothing at all, because the page is "/ru/seasons". Hence the "/*" - it
// stands for the language segment. Only /api/ is written plain; it is the one path without
// a language.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', ...PRIVATE.map((path) => `/*${path}`)],
    },
    sitemap: new URL('sitemap.xml', SITE_URL).href,
  }
}
