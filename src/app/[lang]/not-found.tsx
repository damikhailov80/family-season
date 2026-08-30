import Link from 'next/link'
import { PaperSheet } from '../../components/PaperSheet'
import { SectionBox } from '../../components/SectionBox'
import { getDict, getLang } from '../../i18n/server'
import { ROUTES, withLang } from '../../model/site'
import styles from './not-found.module.css'

/**
 * 404 внутри `[lang]`.
 *
 * Своя страница нужна по двум причинам сразу. Первая: корневой лейаут лежит под
 * `[lang]`, и без неё несуществующий адрес отдавал бы голую заглушку Next — без
 * шапки, подвала и вообще без сайта. Вторая: заглушка эта по-английски, а у нас
 * теперь три языка и ни одной строки в разметке.
 *
 * Ловит и `notFound()` из страниц сезонов — чужой код, отозванный токен,
 * закрытая после жалоб публикация: по ответу не должно быть видно, существовал
 * ли адрес когда-нибудь.
 */
export default async function NotFound() {
  const lang = await getLang()
  const { pages } = await getDict()

  return (
    <PaperSheet>
      <SectionBox accent="deep" label={pages.notFoundTitle} className={styles.section}>
        <p className={styles.text}>{pages.notFoundText}</p>
        <Link className={styles.primary} href={withLang(lang, ROUTES.home)}>
          {pages.notFoundHome}
        </Link>
      </SectionBox>
    </PaperSheet>
  )
}
