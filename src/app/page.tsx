import type { Metadata } from 'next'
import { Examples } from '../components/landing/Examples'
import { Hero } from '../components/landing/Hero'
import { Inside } from '../components/landing/Inside'
import { Steps } from '../components/landing/Steps'
import { PaperSheet } from '../components/PaperSheet'

export const metadata: Metadata = {
  title: 'Семейный сезон — постер следующего месяца вашей семьи',
  description:
    'Что ждёт вас и близких в следующем месяце: соберите постер нового семейного сезона, распечатайте на двух листах A4 и повесьте на холодильник.',
}

/*
 * Раньше лист жил на «/», и разосланные ссылки выглядят как «/#d=…». Хэш до сервера
 * не доходит, поэтому разбирает его инлайн-скрипт: браузер выполняет его синхронно
 * при разборе HTML, до первой отрисовки, так что лендинг не мелькает.
 */
const LEGACY_HASH_REDIRECT =
  "if(location.hash.indexOf('d=')!==-1)location.replace('/sheet'+location.hash)"

export default function Page() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: LEGACY_HASH_REDIRECT }} />
      <PaperSheet>
        <Hero />
        <Steps />
        <Inside />
        <Examples />
      </PaperSheet>
    </>
  )
}
