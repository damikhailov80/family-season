import type { MetadataRoute } from 'next'
import { ROUTES, SITE_URL } from '../model/site'

// Root-only convention, so it stands outside [lang]: the file is one for the whole site, and
// the paths inside it are the language-free ones from ROUTES - a rule per language would say
// the same thing three times.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        `${ROUTES.shared}/`,
        `${ROUTES.season}/`,
        ROUTES.seasons,
        ROUTES.account,
        ROUTES.sheet,
      ],
    },
    sitemap: new URL('sitemap.xml', SITE_URL).href,
  }
}
