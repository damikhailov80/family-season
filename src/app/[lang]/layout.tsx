import type { Metadata } from 'next'
import { Caveat, Marck_Script, Nunito } from 'next/font/google'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { ClaimDraft } from '../../components/site/ClaimDraft'
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
 * Шрифты подключает next/font: файлы отдаёт сам сайт, поэтому лист не мигает
 * системным шрифтом и печатается одинаково без похода в Google Fonts.
 *
 * Подмножества перечислены явно: css2 подбирал их сам, next/font не догадается.
 * `latin-ext` — ради польского: без него `ą ę ł ń ś ź ż` поедут запасным
 * шрифтом, и польский лист напечатается двумя разными гарнитурами сразу.
 *
 * Общей константы у трёх списков нет намеренно: next/font читает аргументы на
 * этапе сборки и требует литерал — на `[...SUBSETS]` сборка падает.
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

/**
 * Языки перечислены здесь ради `[lang]`: без этого сегментом стало бы что угодно,
 * включая `/favicon.svg`. Незнакомый язык до страниц не доходит — `getLang`
 * сводит его к русскому, а `proxy` такой путь и не собрал бы.
 */
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
   * Настройка из базы сильнее браузера — но только когда язык в адрес подставил
   * `proxy`, а не выбрал человек.
   *
   * `proxy` знает лишь куку и `Accept-Language`; языка из базы ему взять неоткуда,
   * ходить в базу он и не должен. Поэтому сверка стоит здесь.
   *
   * Источник `auto` — это заход на адрес **без языка**: `proxy` подставил его сам
   * и пометил свой редирект (см. `src/proxy.ts`). Отличать это от набранного
   * руками адреса обязательно: после редиректа язык стоит в пути ровно так же, и
   * без пометки настройка не побеждала бы никогда.
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
        {/* Обёртка #root осталась от версии на Vite: на неё завязаны отступы экрана
            и рецепт проверки печати (сужение до ширины A4). */}
        <div id="root">
          <LangProvider value={{ lang, dict }}>
            <SiteHeader />
            {/* main растягивается, чтобы подвал прижимался к низу коротких страниц. */}
            <main>{children}</main>
            <SiteFooter />
            {/* Черновик, собранный до входа, уезжает в коллекцию сам — где бы
                человек ни нажал «Войти». Место ему в лейауте по той же причине,
                по какой вход стоит в шапке: разбор один на весь сайт. Рисует он
                разве что тост, а на бумагу тост не идёт. */}
            <ClaimDraft />
            {/* Язык, определённый по браузеру, доезжает до базы отсюда: писать
                при рендере серверный компонент не имеет права, а действие — да. */}
            <LangSync lang={lang} saved={saved} />
          </LangProvider>
        </div>
      </body>
    </html>
  )
}
