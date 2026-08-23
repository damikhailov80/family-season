import Link from 'next/link'
import { ROUTES } from '../../model/site'
import { HeartDoodle } from '../doodles'
import { LoginButtons } from './LoginButtons'
import styles from './SiteHeader.module.css'

/**
 * Общая шапка сайта. Намеренно не `sticky`: тулбар листа уже липнет к верху
 * (`edit/Toolbar.module.css`), а два липких слоя наезжают друг на друга.
 */
export function SiteHeader() {
  return (
    <header className={styles.header}>
      <Link className={styles.brand} href={ROUTES.home}>
        <HeartDoodle className={styles.brandHeart} size={22} />
        <span className={styles.brandName}>Семейный сезон</span>
      </Link>

      <nav className={styles.nav} aria-label="Разделы сайта">
        <Link className={styles.link} href={ROUTES.home}>
          Главная
        </Link>
        <Link className={styles.link} href={ROUTES.seasons}>
          Мои сезоны
        </Link>
        {/* В лист — обычная <a>: он ведёт историю сам, см. комментарий в Hero. */}
        <a className={styles.action} href={ROUTES.sheetEdit}>
          Новый сезон
        </a>
      </nav>

      <LoginButtons />
    </header>
  )
}
