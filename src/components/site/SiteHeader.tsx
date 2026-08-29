import Link from 'next/link'
import { ROUTES } from '../../model/site'
import { HeartDoodle } from '../doodles'
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
        <Link className={styles.link} href={ROUTES.ideas}>
          Идеи сообщества
        </Link>
        <Link className={styles.link} href={ROUTES.seasons}>
          Мои сезоны
        </Link>
        <NewSeasonAction className={styles.action}>Новый сезон</NewSeasonAction>
      </nav>

      <LoginButtons />
    </header>
  )
}
