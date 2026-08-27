import type { Metadata } from 'next'
import Link from 'next/link'
import { PaperSheet } from '../../components/PaperSheet'
import { SectionBox } from '../../components/SectionBox'
import { RocketDoodle } from '../../components/doodles'
import { GoogleLoginButton } from '../../components/site/GoogleLoginButton'
import { Toast } from '../../components/site/Toast'
import { loginWithGoogle } from '../../server/actions'
import { PALETTE_LABELS } from '../../model/palettes'
import {
  LIBRARY_LIMIT,
  TITLE_LIMIT,
  withSeasonMark,
  type LibraryKind,
  type LibrarySort,
} from '../../model/library'
import { ROUTES } from '../../model/site'
import { auth } from '../../server/auth'
import { libraryState, type Entry } from '../../server/library'
import { DeleteEntry } from './DeleteEntry'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Мои сезоны — Семейный сезон',
  description: 'Личный кабинет: сохранённые сезоны и отложенное в избранное.',
}

const TABS: { kind: LibraryKind; label: string }[] = [
  { kind: 'seasons', label: 'Мои' },
  { kind: 'favorites', label: 'Избранное' },
]

/**
 * Поиск и сортировка живут в адресе, а не в состоянии React. Так их можно
 * переслать и перезагрузить, страница остаётся серверной, и всё работает без JS.
 * Умолчания в адрес не пишем — короткий `/seasons` должен оставаться коротким.
 */
function listHref(kind: LibraryKind, search: string, sort: LibrarySort): string {
  const params = new URLSearchParams()
  if (kind !== 'seasons') params.set('tab', kind)
  if (search) params.set('q', search)
  if (sort !== 'date') params.set('sort', sort)
  const query = params.toString()
  return query ? `${ROUTES.seasons}?${query}` : ROUTES.seasons
}

/**
 * «27 августа 2026». Своими руками, а не `Intl`: тот дописывает «г.», и рядом с
 * месяцем самого постера строка начинает рябить. Названия месяцев в проекте и так
 * есть — второму списку взяться неоткуда.
 */
function savedOn(date: Date): string {
  return `${date.getDate()} ${MONTHS_OF[date.getMonth()]} ${date.getFullYear()}`
}

/** Родительный падеж: «27 августа», а не «27 август». */
const MONTHS_OF = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
]

function Row({ entry, kind, back }: { entry: Entry; kind: LibraryKind; back: string }) {
  // Свой сезон открывается с пометкой `s=`: по ней лист узнаёт, какую строку он
  // правит. У избранного пометки нет — это чужой постер, перезаписывать нечего.
  const href = kind === 'seasons' ? withSeasonMark(entry.url, entry.id) : entry.url

  return (
    <li className={styles.entry}>
      {/* Четыре сектора темы — тот же образец, что на кнопке переключателя:
          по одной краске набор не узнать. */}
      <span
        className={styles.ink}
        data-palette={entry.palette}
        title={PALETTE_LABELS[entry.palette]}
        aria-hidden="true"
      />
      <span className={styles.entryText}>
        <a className={styles.entryTitle} href={href}>
          {entry.title}
        </a>
        <span className={styles.entryMeta}>
          сохранён {savedOn(entry.savedAt)}
          {entry.month ? ` · ${entry.month}` : ''}
        </span>
      </span>
      <DeleteEntry kind={kind} id={entry.id} title={entry.title} back={back} />
    </li>
  )
}

/**
 * Кабинет открыт только вошедшим. Проверка стоит прямо здесь, в серверном
 * компоненте, а не в `proxy.ts`: это и есть проверка у источника данных, а
 * прокси по документации Next — лишь оптимистичная догадка и рубежом защиты
 * быть не может.
 *
 * Незалогиненного не уводим редиректом: адрес «Мои сезоны» есть в шапке, и он
 * обязан открываться и объяснять себя. Отдельная страница входа поэтому не нужна.
 */
export default async function SeasonsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string; sort?: string }>
}) {
  const session = await auth()
  const who = session?.user?.name || session?.user?.email

  if (!who) {
    return (
      <PaperSheet>
        <SectionBox accent="deep" label="Мои сезоны" className={styles.section}>
          <h1 className={styles.title}>Здесь живут ваши сезоны</h1>
          <p className={styles.text}>
            Все прожитые сезоны в одном месте: вернуться к прошлому месяцу, посмотреть, что из
            задуманного случилось, и собрать следующий из готового. Чтобы отличить ваши сезоны
            от чужих, нужно войти.
          </p>
          <div className={styles.login}>
            <GoogleLoginButton />
          </div>
          <p className={styles.hand}>
            А собрать и распечатать постер можно и без входа — сезон целиком помещается в ссылку.
          </p>
          <a className={styles.primary} href={ROUTES.sheetEdit}>
            Собрать свой сезон
          </a>
        </SectionBox>
      </PaperSheet>
    )
  }

  const flags = await searchParams
  const kind: LibraryKind = flags.tab === 'favorites' ? 'favorites' : 'seasons'
  const sort: LibrarySort = flags.sort === 'name' ? 'name' : 'date'
  // Строку поиска режем по тому же пределу, что и название: искать длиннее нечего.
  const search = typeof flags.q === 'string' ? flags.q.slice(0, TITLE_LIMIT) : ''
  const state = await libraryState(kind, search, sort)
  const here = listHref(kind, search, sort)

  return (
    <PaperSheet>
      <SectionBox accent="deep" label="Мои сезоны" className={styles.section}>
        <RocketDoodle className={styles.rocket} size={54} />
        <h1 className={styles.title}>Здравствуйте, {who}!</h1>

        <nav className={styles.tabs} aria-label="Что показать">
          {TABS.map((tab) => (
            <Link
              key={tab.kind}
              className={tab.kind === kind ? styles.tabActive : styles.tab}
              href={listHref(tab.kind, search, sort)}
              aria-current={tab.kind === kind ? 'page' : undefined}
            >
              {tab.label}
            </Link>
          ))}
        </nav>

        {/* Обычная GET-форма: поиск обязан пережить перезагрузку и пересылку,
            а страница — остаться серверной. */}
        <form className={styles.filters} action={ROUTES.seasons} method="get">
          {kind !== 'seasons' && <input type="hidden" name="tab" value={kind} />}
          {sort !== 'date' && <input type="hidden" name="sort" value={sort} />}
          <input
            className={styles.search}
            type="search"
            name="q"
            defaultValue={search}
            maxLength={TITLE_LIMIT}
            placeholder="Поиск по названию"
            aria-label="Поиск по названию"
          />
          <button type="submit" className={styles.ghost}>
            Найти
          </button>
          <span className={styles.sort}>
            <Link
              className={sort === 'date' ? styles.sortActive : styles.sortLink}
              href={listHref(kind, search, 'date')}
            >
              по дате
            </Link>
            <Link
              className={sort === 'name' ? styles.sortActive : styles.sortLink}
              href={listHref(kind, search, 'name')}
            >
              по названию
            </Link>
          </span>
        </form>

        {/* Не прочитали — показываем пустоту и тост, а не умолчание: выдумывать
            содержимое списка нельзя. */}
        {state.status === 'ok' &&
          (state.entries.length ? (
            <ul className={styles.entries}>
              {state.entries.map((entry) => (
                <Row key={entry.id} entry={entry} kind={kind} back={here} />
              ))}
            </ul>
          ) : (
            <p className={styles.hand}>
              {search
                ? 'По этому запросу ничего не нашлось.'
                : kind === 'seasons'
                  ? 'Сохранённых сезонов пока нет. Соберите постер и нажмите на нём «Сохранить».'
                  : 'В избранном пока пусто. Нажмите ☆ на любом постере — он ляжет сюда.'}
            </p>
          ))}

        {state.status === 'stale' && (
          <div className={styles.warn}>
            <p className={styles.text}>
              Вход был выполнен до того, как появился кабинет, и привязать сезоны не к чему.
              Лечится одним повторным входом.
            </p>
            <form action={loginWithGoogle}>
              <button type="submit" className={styles.ghost}>
                Войти заново
              </button>
            </form>
          </div>
        )}

        <a className={styles.primary} href={ROUTES.sheetEdit}>
          Собрать свой сезон
        </a>

        <p className={styles.note}>
          Имя и почта лежат только в куке вашего браузера — на сервере их нет. В базе у нас
          настройки кабинета и адреса ваших постеров, до {LIBRARY_LIMIT} сохранённых сезонов и
          столько же закладок; подробности — на странице «Приватность».
        </p>

        {state.status === 'error' && (
          <Toast message="Не удалось загрузить список — ошибка на сервере." />
        )}
      </SectionBox>
    </PaperSheet>
  )
}
