import type { Metadata } from 'next'
import Link from 'next/link'
import { PaperSheet } from '../../../components/PaperSheet'
import { SectionBox } from '../../../components/SectionBox'
import { Toast } from '../../../components/site/Toast'
import { NewSeasonAction } from '../../../components/site/NewSeasonAction'
import { GoogleLoginButton } from '../../../components/site/GoogleLoginButton'
import { getDict, getLang } from '../../../i18n/server'
import { fill } from '../../../i18n/fill'
import type { Dict } from '../../../i18n/types'
import type { Lang } from '../../../model/lang'
import { paletteLabel } from '../../../model/palettes'
import { LIBRARY_LIMIT, savedOn, TITLE_LIMIT, type LibrarySort } from '../../../model/library'
import { publicSeasonHref, ROUTES, seasonHref, withLang } from '../../../model/site'
import { auth } from '../../../server/auth'
import { listFavorites, listPublished } from '../../../server/publicSeasons'
import { listUserSeasons } from '../../../server/userSeasons'
import { UnfavoriteEntry } from './UnfavoriteEntry'
import { ShowcaseEntry } from './ShowcaseEntry'
import type { PaletteId } from '../../../types'
import { DeleteEntry } from './DeleteEntry'
import { DraftEntry } from './DraftEntry'
import { RenameEntry } from './RenameEntry'
import styles from './page.module.css'

export async function generateMetadata(): Promise<Metadata> {
  const { seasons } = await getDict()
  return { title: seasons.title, description: seasons.description }
}

type Tab = 'seasons' | 'favorites' | 'published'

const TABS: Tab[] = ['seasons', 'favorites', 'published']

function tabLabel(kind: Tab, dict: Dict): string {
  return kind === 'seasons'
    ? dict.seasons.tabSeasons
    : kind === 'favorites'
      ? dict.seasons.tabFavorites
      : dict.seasons.tabPublished
}

/**
 * Поиск и сортировка живут в адресе, а не в состоянии React: их можно переслать и
 * перезагрузить, а страница остаётся серверной. Умолчания в адрес не пишем.
 */
function listHref(lang: Lang, kind: Tab, search: string, sort: LibrarySort): string {
  const params = new URLSearchParams()
  if (kind !== 'seasons') params.set('tab', kind)
  if (search) params.set('q', search)
  if (sort !== 'date') params.set('sort', sort)
  const query = params.toString()
  const base = withLang(lang, ROUTES.seasons)
  return query ? `${base}?${query}` : base
}

/** Все три вкладки сводятся к одной строке заранее. */
interface RowData {
  code: string
  title: string
  savedAt: Date
  palette: PaletteId
  month: string | null
  /** Язык сезона: им названы месяц и сам сезон. Список от него не зависит. */
  lang: Lang
  /** У отложенного и выложенного: сезон сняли с витрины, но ссылка работает. */
  hidden?: boolean
  /** Только у своих публикаций: закрыта после разбора жалоб. */
  blocked?: boolean
  likes?: number
  favorites?: number
  forks?: number
}

function Row({
  entry,
  kind,
  back,
  lang,
  dict,
}: {
  entry: RowData
  kind: Tab
  back: string
  lang: Lang
  dict: Dict
}) {
  const { seasons } = dict
  return (
    <li className={styles.entry}>
      {/* Четыре сектора: по одной краске набор не узнать. */}
      <span
        className={styles.ink}
        data-palette={entry.palette}
        title={paletteLabel(entry.palette, lang)}
        aria-hidden="true"
      />
      <span className={styles.entryText}>
        {/* Закрытый сезон не открывается нигде — ссылка вела бы в 404. */}
        {entry.blocked ? (
          <span className={styles.entryTitle}>{entry.title}</span>
        ) : (
          <a
            className={styles.entryTitle}
            href={
              kind === 'seasons'
                ? seasonHref(lang, entry.code)
                : // Публикация живёт только в своём языке: у отложенного и
                  // выложенного он может отличаться от языка кабинета.
                  publicSeasonHref(entry.lang, entry.code)
            }
          >
            {entry.title}
          </a>
        )}
        <span className={styles.entryMeta}>
          {kind === 'seasons'
            ? seasons.savedAt
            : kind === 'favorites'
              ? seasons.favoritedAt
              : seasons.publishedAt}{' '}
          {savedOn(entry.savedAt, lang)}
          {entry.month ? ` · ${entry.month}` : ''}
          {/* Разделитель — снаружи пометки: у `.offStage` `display: inline-flex`,
              а флекс-контейнер срезает ведущий пробел внутри себя. */}
          {(entry.blocked || entry.hidden) && ' · '}
          {entry.blocked ? (
            <span className={styles.offStage}>{seasons.blocked}</span>
          ) : (
            entry.hidden && <span className={styles.offStage}>{seasons.offStage}</span>
          )}
        </span>
        {/* Числа автору показываем всегда, включая нули: это его собственные
            данные, а не оценка. Своей строкой и одинаковыми парами «слово: число» —
            в общей подписи они собирались в неопрятный хвост. */}
        {kind === 'published' && (
          <span className={styles.entryStats}>
            {fill(seasons.statLikes, { n: entry.likes ?? 0 })} ·{' '}
            {fill(seasons.statFavorites, { n: entry.favorites ?? 0 })} ·{' '}
            {fill(seasons.statForks, { n: entry.forks ?? 0 })}
          </span>
        )}
      </span>
      <span className={styles.rowTools}>
        {kind === 'seasons' && (
          <>
            <RenameEntry code={entry.code} title={entry.title} back={back} lang={entry.lang} />
            <DeleteEntry code={entry.code} title={entry.title} back={back} />
          </>
        )}
        {/* Убрать закладку — не удаление: подтверждать нечего. */}
        {kind === 'favorites' && (
          <UnfavoriteEntry code={entry.code} title={entry.title} back={back} />
        )}
        {/* Кнопки нет только у закрытого после жалоб: там решает не автор. */}
        {kind === 'published' && !entry.blocked && (
          <ShowcaseEntry
            code={entry.code}
            title={entry.title}
            hidden={Boolean(entry.hidden)}
            back={back}
            lang={lang}
          />
        )}
      </span>
    </li>
  )
}

/**
 * Проверка входа стоит здесь, в серверном компоненте, а не в `proxy.ts`: это и
 * есть проверка у источника данных, а прокси — лишь оптимистичная догадка.
 *
 * Незалогиненного не уводим редиректом: адрес есть в шапке и обязан открываться.
 * Список у него тот же самый, только короткий — черновик в браузере один.
 */
export default async function SeasonsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string; sort?: string; add?: string }>
}) {
  const lang = await getLang()
  const dict = await getDict()
  const { seasons } = dict
  const session = await auth()
  // Нужен сам факт входа: от него зависит, где лежат сезоны.
  const signedIn = Boolean(session?.user?.name || session?.user?.email)

  if (!signedIn) {
    return (
      <PaperSheet>
        <SectionBox accent="deep" label={seasons.heading} className={styles.section}>
          {/* Про вход разговор ведёт окно заведения сезона: вторая проповедь на
              пустой странице ничего не добавляет. Вкладок анониму не показываем —
              избранного и публикаций без входа не бывает. */}
          <DraftEntry />

          <NewSeasonAction className={styles.primary}>{seasons.newSeason}</NewSeasonAction>
        </SectionBox>
      </PaperSheet>
    )
  }

  const flags = await searchParams
  const kind: Tab = flags.tab === 'favorites' || flags.tab === 'published' ? flags.tab : 'seasons'
  const sort: LibrarySort = flags.sort === 'name' ? 'name' : 'date'
  const search = typeof flags.q === 'string' ? flags.q.slice(0, TITLE_LIMIT) : ''
  const here = listHref(lang, kind, search, sort)
  const state =
    kind === 'seasons'
      ? await listUserSeasons(search, sort)
      : kind === 'favorites'
        ? await listFavorites(search, sort, lang)
        : await listPublished(search, sort, lang)
  const entries: RowData[] = state.status === 'ok' ? state.entries : []

  return (
    <PaperSheet>
      <SectionBox accent="deep" label={seasons.heading} className={styles.section}>
        <nav className={styles.tabs} aria-label={seasons.tabsAria}>
          {TABS.map((tab) => (
            <Link
              key={tab}
              className={tab === kind ? styles.tabActive : styles.tab}
              href={listHref(lang, tab, search, sort)}
              aria-current={tab === kind ? 'page' : undefined}
            >
              {tabLabel(tab, dict)}
            </Link>
          ))}
        </nav>

        {/* Обычная GET-форма: поиск обязан пережить перезагрузку и пересылку. */}
        <form className={styles.filters} action={withLang(lang, ROUTES.seasons)} method="get">
          {kind !== 'seasons' && <input type="hidden" name="tab" value={kind} />}
          {sort !== 'date' && <input type="hidden" name="sort" value={sort} />}
          <input
            className={styles.search}
            type="search"
            name="q"
            defaultValue={search}
            maxLength={TITLE_LIMIT}
            placeholder={seasons.searchPlaceholder}
            aria-label={seasons.searchPlaceholder}
          />
          <button type="submit" className={styles.ghost}>
            {seasons.searchAction}
          </button>
          <span className={styles.sort}>
            <Link
              className={sort === 'date' ? styles.sortActive : styles.sortLink}
              href={listHref(lang, kind, search, 'date')}
            >
              {seasons.sortByDate}
            </Link>
            <Link
              className={sort === 'name' ? styles.sortActive : styles.sortLink}
              href={listHref(lang, kind, search, 'name')}
            >
              {seasons.sortByName}
            </Link>
          </span>
        </form>

        {state.status === 'ok' &&
          (entries.length ? (
            <ul className={styles.entries}>
              {entries.map((entry) => (
                <Row
                  key={entry.code}
                  entry={entry}
                  kind={kind}
                  back={here}
                  lang={lang}
                  dict={dict}
                />
              ))}
            </ul>
          ) : (
            <p className={styles.hand}>
              {search
                ? seasons.nothingFound
                : kind === 'seasons'
                  ? dict.status.emptyList
                  : kind === 'favorites'
                    ? seasons.emptyFavorites
                    : seasons.emptyPublished}
            </p>
          ))}

        {state.status === 'stale' && (
          <div className={styles.warn}>
            <p className={styles.text}>{seasons.staleNote}</p>
            <GoogleLoginButton label={dict.site.loginAgain} />
          </div>
        )}

        <NewSeasonAction className={styles.primary}>{seasons.newSeason}</NewSeasonAction>

        {state.status === 'error' && <Toast message={seasons.listError} />}

        {/* Сюда возвращается неудача «Нового сезона»: человек оказался здесь
            вместо своего сезона, и молчать об этом нельзя. */}
        {flags.add === 'limit' && <Toast message={fill(seasons.addLimit, { n: LIBRARY_LIMIT })} />}
        {flags.add && flags.add !== 'limit' && <Toast message={seasons.addError} />}
      </SectionBox>
    </PaperSheet>
  )
}
