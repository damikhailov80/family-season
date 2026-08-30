import Link from 'next/link'
import { headers } from 'next/headers'
import { getDict, getLang } from '../../i18n/server'
import { LANG_PATH_HEADER } from '../../model/lang'
import { CONTACT_EMAIL, ROUTES, withLang } from '../../model/site'
import { HeartDoodle } from '../doodles'
import { LangSwitcher } from './LangSwitcher'
import styles from './SiteFooter.module.css'

/**
 * Переключатель языка стоит здесь, а не в шапке: язык выбирают один раз, а
 * шапка занята тем, чем пользуются каждый день. Вошедший меняет его в кабинете —
 * там выбор переживает смену браузера.
 *
 * Путь для ссылок приходит заголовком от `proxy`: переключение обязано оставлять
 * человека на той же странице, а своего адреса серверный компонент не знает.
 */
export async function SiteFooter() {
  const lang = await getLang()
  const { site } = await getDict()
  const path = (await headers()).get(LANG_PATH_HEADER) || '/'

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
      <LangSwitcher lang={lang} path={path} label={site.langsAria} />
    </footer>
  )
}
