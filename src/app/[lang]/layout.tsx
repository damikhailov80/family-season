import type { Metadata } from 'next'
import { Caveat, Marck_Script, Nunito } from 'next/font/google'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { ClaimDraft } from '../../components/site/ClaimDraft'
import { ConsentGate } from '../../components/site/ConsentGate'
import { LangSync } from '../../components/site/LangSync'
import { SiteFooter } from '../../components/site/SiteFooter'
import { SiteHeader } from '../../components/site/SiteHeader'
import { LangProvider } from '../../i18n/LangProvider'
import { getDict, getLang } from '../../i18n/server'
import { LANG_PATH_HEADER, LANG_SOURCE_HEADER, LANGS } from '../../model/lang'
import { withLang } from '../../model/site'
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
  const dict = await getDict()
  return {
    title: dict.site.brand,
    description: dict.site.description,
    icons: { icon: '/favicon.svg' },
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
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
          </LangProvider>
        </div>
      </body>
    </html>
  )
}
