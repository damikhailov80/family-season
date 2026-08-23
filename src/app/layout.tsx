import type { Metadata } from 'next'
import { Caveat, Marck_Script, Nunito } from 'next/font/google'
import '../styles/tokens.css'
import '../styles/global.css'
import '../styles/print.css'

/*
 * Шрифты подключает next/font: файлы отдаёт сам сайт, поэтому лист не мигает
 * системным шрифтом и печатается одинаково без похода в Google Fonts.
 * Кириллица явно в subsets — css2 подбирал её сам, next/font требует указать.
 */
const nunito = Nunito({
  subsets: ['cyrillic', 'latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-nunito',
  display: 'swap',
})

const caveat = Caveat({
  subsets: ['cyrillic', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-caveat',
  display: 'swap',
})

const marckScript = Marck_Script({
  subsets: ['cyrillic', 'latin'],
  weight: '400',
  variable: '--font-marck-script',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Семейный сезон',
  description: 'Бланк семейного месяца: печатается на двух листах A4 и живёт целиком в ссылке.',
  icons: { icon: '/favicon.svg' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${nunito.variable} ${caveat.variable} ${marckScript.variable}`}>
      <body>
        {/* Обёртка #root осталась от версии на Vite: на неё завязаны отступы экрана
            и рецепт проверки печати (сужение до ширины A4). */}
        <div id="root">{children}</div>
      </body>
    </html>
  )
}
