import Link from 'next/link'
import { ConsentLink } from './ConsentLink'
import { getDict, getLang } from '../../i18n/server'
import { analyticsId } from '../../server/consent'
import { CONTACT_EMAIL, ROUTES, withLang } from '../../model/site'
import { HeartDoodle } from '../doodles'
import styles from './SiteFooter.module.css'

/**
 * Переключатель языка стоял здесь и переехал в шапку: у невошедшего это
 * единственный способ сменить язык, а до подвала лендинга он не доходит —
 * см. `LangSwitcher`.
 */
export async function SiteFooter() {
  const lang = await getLang()
  const { site } = await getDict()

  return (
    <footer className={styles.footer}>
      <HeartDoodle className={styles.heart} size={26} />
      <p className={styles.note}>{site.footerNote}</p>
      <a className={styles.mail} href={`mailto:${CONTACT_EMAIL}`}>
        {CONTACT_EMAIL}
      </a>
      <Link className={styles.link} href={withLang(lang, ROUTES.privacy)}>
        {site.privacy}
      </Link>
      {/* Отзыв согласия — единственный способ передумать для невошедшего.
          Без счётчика отзывать нечего, и строки нет. */}
      {analyticsId() && <ConsentLink />}
    </footer>
  )
}
