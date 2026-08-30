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

/**
 * Общая шапка сайта. Намеренно не `sticky`: тулбар листа уже липнет к верху
 * (`edit/Bar.module.css`), а два липких слоя наезжают друг на друга.
 *
 * «Новый сезон» — одна кнопка на обе роли (`NewSeasonAction`): она спрашивает имя
 * и уже потом решает, куда лёг сезон — строкой в базу у вошедшего, черновиком в
 * браузер у остальных. Развилки здесь больше нет, и сессию шапка читает только
 * ради `LoginButtons`.
 *
 * Сессию сама шапка больше не читает: её спрашивают `LoginButtons` и
 * `NewSeasonAction`, каждый для себя. Маршрут от этого динамическим быть не
 * перестал — читатели те же, просто ниже.
 */
export async function SiteHeader() {
  const lang = await getLang()
  const { site } = await getDict()
  // Путь для ссылок переключателя приходит заголовком от `proxy`: смена языка
  // обязана оставлять человека на той же странице, а своего адреса серверный
  // компонент не знает.
  const path = (await headers()).get(LANG_PATH_HEADER) || '/'

  return (
    <header className={styles.header}>
      <Link className={styles.brand} href={withLang(lang, ROUTES.home)}>
        <HeartDoodle className={styles.brandHeart} size={22} />
        <span className={styles.brandName}>{site.brand}</span>
      </Link>

      <nav className={styles.nav} aria-label={site.navAria}>
        <Link className={styles.link} href={withLang(lang, ROUTES.home)}>
          {site.home}
        </Link>
        <Link className={styles.link} href={withLang(lang, ROUTES.ideas)}>
          {site.ideas}
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
