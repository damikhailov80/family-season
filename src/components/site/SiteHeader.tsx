import Link from 'next/link'
import { ROUTES } from '../../model/site'
import { auth } from '../../server/auth'
import { createSeason } from '../../server/actions'
import { HeartDoodle } from '../doodles'
import { LoginButtons } from './LoginButtons'
import styles from './SiteHeader.module.css'

/**
 * Общая шапка сайта. Намеренно не `sticky`: тулбар листа уже липнет к верху
 * (`edit/Bar.module.css`), а два липких слоя наезжают друг на друга.
 *
 * «Новый сезон» у вошедшего — **действие, а не ссылка**: сезон заводится строкой
 * сразу, вместе с составом семьи из кабинета, и человек попадает уже в него.
 * Раньше здесь собирался бланк и уезжал в хэш ссылки — теперь бланку место в
 * базе, и собирает его само действие (`createSeason`).
 *
 * У невошедшего ссылка на черновик остаётся: собрать и распечатать постер можно
 * и без входа.
 *
 * Чтение сессии намеренно **вне** `try`: `auth()` трогает куки, а Next сообщает
 * «эта страница обязана быть динамической» через исключение. Проглотив его, мы
 * не дали бы роутеру пометить маршрут и завалили бы сборку логом.
 */
export async function SiteHeader() {
  const session = await auth()

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
        {session?.user ? (
          // `display: contents` у формы: кнопка обязана встать в ряд навигации
          // так же, как встала бы ссылка, а сама форма в раскладке лишняя.
          <form className={styles.plainForm} action={createSeason}>
            <button type="submit" className={styles.action}>
              Новый сезон
            </button>
          </form>
        ) : (
          // В лист — обычная <a>: он ведёт историю сам, см. комментарий в Hero.
          <a className={styles.action} href={ROUTES.sheetEdit}>
            Новый сезон
          </a>
        )}
      </nav>

      <LoginButtons />
    </header>
  )
}
