import Link from 'next/link'
import { headers } from 'next/headers'
import { getDict, getLang } from '../../i18n/server'
import { LANG_PATH_HEADER } from '../../model/lang'
import { ROUTES, withLang } from '../../model/site'
import { HeartDoodle } from '../doodles'
import { LangSwitcher } from './LangSwitcher'
import { LoginButtons } from './LoginButtons'
import { NewSeasonAction } from './NewSeasonAction'
import styles from './SiteHeader.module.css'

export async function SiteHeader() {
  const lang = await getLang()
  const { site } = await getDict()
  const path = (await headers()).get(LANG_PATH_HEADER) || '/'

  return (
    <header className={styles.header}>
      <Link className={styles.brand} href={withLang(lang, ROUTES.home)}>
        <HeartDoodle className={styles.brandHeart} size={22} />
        <span className={styles.brandName}>{site.brand}</span>
      </Link>

      <nav className={styles.nav} aria-label={site.navAria}>
        <Link className={styles.link} href={withLang(lang, ROUTES.ideas)}>
          {site.ideas}
        </Link>
        <Link className={styles.link} href={withLang(lang, ROUTES.month)}>
          {site.months}
        </Link>
        <Link className={styles.link} href={withLang(lang, ROUTES.seasons)}>
          {site.seasons}
        </Link>
        <NewSeasonAction className={styles.action}>{site.newSeason}</NewSeasonAction>
      </nav>

      <LangSwitcher lang={lang} path={path} label={site.langsAria} />
      <LoginButtons />
    </header>
  )
}
