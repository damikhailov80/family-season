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

/*
 * Подмножества перечислены явно: css2 подбирал их сам, next/font не догадается.
 * `latin-ext` — ради польского: без него `ą ę ł ń ś ź ż` поедут запасным шрифтом,
 * и лист напечатается двумя гарнитурами сразу.
 *
 * Общей константы у трёх списков нет намеренно: next/font требует литерал — на
 * `[...SUBSETS]` сборка падает.
 */
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

/** Без этого сегментом `[lang]` стало бы что угодно, включая `/favicon.svg`. */
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

  /*
   * Настройка из базы сильнее браузера, но только когда язык подставил `proxy`, а
   * не выбрал человек: сверка стоит здесь, потому что в базу `proxy` не ходит.
   *
   * Уводим на язык настройки — и на этом всё кончается: следующий запрос придёт
   * без пометки, источником будет `url`, а кука станет равна базе.
   */
  const incoming = await headers()
  const saved = await readLanguage()
  if (saved && saved !== lang && incoming.get(LANG_SOURCE_HEADER) !== 'url') {
    redirect(withLang(saved, incoming.get(LANG_PATH_HEADER) || '/'))
  }

  return (
    <html lang={lang} className={`${nunito.variable} ${caveat.variable} ${marckScript.variable}`}>
      <body>
        {/* Обёртка #root: на неё завязаны отступы экрана и рецепт проверки печати. */}
        <div id="root">
          <LangProvider value={{ lang, dict }}>
            <SiteHeader />
            <main>{children}</main>
            <SiteFooter />
            {/* Черновик, собранный до входа, уезжает в коллекцию сам — где бы
                человек ни нажал «Войти». Отсюда и место в лейауте. */}
            <ClaimDraft />
            {/* Язык, определённый по браузеру, доезжает до базы отсюда: писать при
                рендере серверный компонент не имеет права, а действие — да. */}
            <LangSync lang={lang} saved={saved} />
            {/* Вопрос о согласии один на весь сайт, и задать его надо на той
                странице, куда человек пришёл, — отсюда место в лейауте. */}
            <ConsentGate />
          </LangProvider>
        </div>
      </body>
    </html>
  )
}
