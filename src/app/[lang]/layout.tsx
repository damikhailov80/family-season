import type { Metadata } from 'next'
import { Caveat, Marck_Script, Nunito } from 'next/font/google'
import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { lang as rootLang } from 'next/root-params'
import { ClaimDraft } from '../../components/site/ClaimDraft'
import { ConsentGate } from '../../components/site/ConsentGate'
import { LangSync } from '../../components/site/LangSync'
import { SiteFooter } from '../../components/site/SiteFooter'
import { SiteHeader } from '../../components/site/SiteHeader'
import { SiteSchema } from '../../components/site/StructuredData'
import { LangProvider } from '../../i18n/LangProvider'
import { getDict, getLang } from '../../i18n/server'
import { LANG_PATH_HEADER, LANG_SOURCE_HEADER, LANGS, langOrNull } from '../../model/lang'
import { pageMeta } from '../../model/meta'
import { ROUTES, SITE_URL, withLang } from '../../model/site'
import { readLanguage } from '../../server/settings'
import '../../styles/tokens.css'
import '../../styles/palettes.css'
import '../../styles/global.css'
import '../../styles/print.css'

const nunito = Nunito({
  subsets: ['cyrillic', 'latin', 'latin-ext'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-nunito',
  display: 'swap',
})

const caveat = Caveat({
  subsets: ['cyrillic', 'latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-caveat',
  display: 'swap',
})

const marckScript = Marck_Script({
  subsets: ['cyrillic', 'latin', 'latin-ext'],
  weight: '400',
  variable: '--font-marck-script',
  display: 'swap',
})

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }))
}

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang()
  const { site } = await getDict()
  return {
    metadataBase: new URL(SITE_URL),
    ...pageMeta({
      lang,
      path: ROUTES.home,
      title: site.brand,
      description: site.description,
      siteName: site.brand,
      ogAlt: site.ogAlt,
      alternates: 'none',
    }),
    icons: {
      icon: [
        { url: '/favicon.ico', sizes: '48x48' },
        { url: '/favicon.svg', type: 'image/svg+xml' },
        { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
      ],
      apple: '/apple-icon.png',
    },
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Every address carries the language, and the proxy supplies a missing one - but it lets
  // paths with an extension through untouched, and there [lang] would swallow "favicon.ico"
  // and knownLang would quietly answer Russian. That is how /favicon.ico came to serve the
  // landing page with code 200 and Google was left without an icon. dynamicParams = false
  // does not help here: nothing is prerendered, so the params are never checked against
  // generateStaticParams.
  if (!langOrNull(await rootLang())) notFound()

  const lang = await getLang()
  const dict = await getDict()

  const incoming = await headers()
  const saved = await readLanguage()
  if (saved && saved !== lang && incoming.get(LANG_SOURCE_HEADER) !== 'url') {
    redirect(withLang(saved, incoming.get(LANG_PATH_HEADER) || '/'))
  }

  return (
    <html lang={lang} className={`${nunito.variable} ${caveat.variable} ${marckScript.variable}`}>
      <body>
        <div id="root">
          <LangProvider value={{ lang, dict }}>
            <SiteHeader />
            <main>{children}</main>
            <SiteFooter />
            <ClaimDraft />
            <LangSync lang={lang} saved={saved} />
            <ConsentGate />
            <SiteSchema />
          </LangProvider>
        </div>
      </body>
    </html>
  )
}
