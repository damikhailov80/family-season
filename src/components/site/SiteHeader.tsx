import Link from 'next/link'
import { ROUTES } from '../../model/site'
import { encodeTemplate, hashFor } from '../../model/codec'
import { templateForFamily } from '../../model/family'
import { DEFAULT_PALETTE } from '../../model/palettes'
import { DEFAULT_ICON_SET } from '../../model/icons'
import { readFamily } from '../../server/settings'
import { HeartDoodle } from '../doodles'
import { LoginButtons } from './LoginButtons'
import styles from './SiteHeader.module.css'

/**
 * Адрес кнопки «Новый сезон». Если человек вошёл и выбрал состав семьи, бланк
 * собирается здесь же и уезжает в ссылку готовым — постеру не нужно ни знать
 * о базе, ни ходить в неё: он как читал бланк из хэша, так и читает.
 *
 * Во всех остальных случаях — сегодняшний голый `/sheet/edit`, который лист
 * понимает как «пустой бланк». Сюда же откатываемся при любой ошибке: ссылка
 * в шапке не имеет права сломать страницу.
 */
async function newSeasonHref(): Promise<string> {
  /*
   * Чтение сессии и настроек намеренно **вне** `try`: `auth()` трогает куки, а
   * Next сообщает «эта страница обязана быть динамической» через исключение.
   * Проглотив его, мы не дали бы роутеру пометить маршрут и завалили бы сборку
   * логом. Ронять страницу этому чтению нечем: `query` в `db.ts` не бросает.
   */
  const family = await readFamily()
  if (!family) return ROUTES.sheetEdit

  try {
    const payload = await encodeTemplate(templateForFamily(family))
    return ROUTES.sheetEdit + hashFor(payload, DEFAULT_PALETTE, DEFAULT_ICON_SET)
  } catch (error) {
    // Кодирование — единственное, что тут может сломаться по-настоящему.
    console.error('[header] не собрал ссылку на новый сезон:', error)
    return ROUTES.sheetEdit
  }
}

/**
 * Общая шапка сайта. Намеренно не `sticky`: тулбар листа уже липнет к верху
 * (`edit/Toolbar.module.css`), а два липких слоя наезжают друг на друга.
 */
export async function SiteHeader() {
  const sheetEditHref = await newSeasonHref()

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
        {/* В лист — обычная <a>: он ведёт историю сам, см. комментарий в Hero. */}
        <a className={styles.action} href={sheetEditHref}>
          Новый сезон
        </a>
      </nav>

      <LoginButtons />
    </header>
  )
}
