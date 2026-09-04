import { getDict, getLang } from '../../i18n/server'
import { LANGS } from '../../model/lang'
import { CONTACT_EMAIL, ROUTES, SITE_URL, withLang } from '../../model/site'

const ORGANIZATION = `${SITE_URL}#organization`
const WEBSITE = `${SITE_URL}#website`

const absolute = (path: string) => new URL(path, SITE_URL).href

// JSON.stringify escapes nothing that would close the tag, but a "<" inside any translated
// string still ends the script element in an HTML parser.
function jsonLd(data: object) {
  return { __html: JSON.stringify(data).replace(/</g, '\\u003c') }
}

// The brand collides with television vocabulary ("season"), and prose alone will not tell
// Google which entity this is. The graph says it outright: a free web application, not a
// series - which is also what alternateName in the dictionaries is for.
export async function SiteSchema() {
  const lang = await getLang()
  const { site } = await getDict()

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={jsonLd({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Organization',
            '@id': ORGANIZATION,
            name: site.brand,
            url: SITE_URL,
            email: CONTACT_EMAIL,
            logo: absolute('/icon-192.png'),
          },
          {
            '@type': 'WebSite',
            '@id': WEBSITE,
            name: site.brand,
            alternateName: site.alternateName,
            description: site.description,
            url: absolute(withLang(lang, ROUTES.home)),
            inLanguage: lang,
            publisher: { '@id': ORGANIZATION },
          },
        ],
      })}
    />
  )
}

export async function AppSchema() {
  const lang = await getLang()
  const { landing, site } = await getDict()

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={jsonLd({
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        '@id': `${SITE_URL}#app`,
        name: site.brand,
        alternateName: site.alternateName,
        description: landing.description,
        url: absolute(withLang(lang, ROUTES.home)),
        applicationCategory: 'LifestyleApplication',
        operatingSystem: 'Web',
        isAccessibleForFree: true,
        inLanguage: [...LANGS],
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        publisher: { '@id': ORGANIZATION },
        isPartOf: { '@id': WEBSITE },
      })}
    />
  )
}
