import type { Metadata } from 'next'
import Link from 'next/link'
import { PaperSheet } from '../../components/PaperSheet'
import { SectionBox } from '../../components/SectionBox'
import { Toast } from '../../components/site/Toast'
import { NewSeasonAction } from '../../components/site/NewSeasonAction'
import { GoogleLoginButton } from '../../components/site/GoogleLoginButton'
import { PALETTE_LABELS } from '../../model/palettes'
import {
  EMPTY_LIST,
  LIBRARY_LIMIT,
  savedOn,
  TITLE_LIMIT,
  type LibrarySort,
} from '../../model/library'
import { publicSeasonHref, ROUTES, seasonHref } from '../../model/site'
import { auth } from '../../server/auth'
import { listFavorites, listPublished } from '../../server/publicSeasons'
import { listUserSeasons } from '../../server/userSeasons'
import { UnfavoriteEntry } from './UnfavoriteEntry'
import { WithdrawEntry } from './WithdrawEntry'
import type { PaletteId } from '../../types'
import { DeleteEntry } from './DeleteEntry'
import { DraftEntry } from './DraftEntry'
import { RenameEntry } from './RenameEntry'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Мои сезоны — Семейный сезон',
  description: 'Личный кабинет: сохранённые сезоны и отложенное в избранное.',
}

/** Что показать: свои сезоны, отложенное чужое или своё выложенное. */
type Tab = 'seasons' | 'favorites' | 'published'

const TABS: { kind: Tab; label: string }[] = [
  { kind: 'seasons', label: 'Мои' },
  { kind: 'favorites', label: 'Избранное' },
  { kind: 'published', label: 'Опубликованные' },
]

/**
 * Поиск и сортировка живут в адресе, а не в состоянии React. Так их можно
 * переслать и перезагрузить, страница остаётся серверной, и всё работает без JS.
 * Умолчания в адрес не пишем — короткий `/seasons` должен оставаться коротким.
 */
function listHref(kind: Tab, search: string, sort: LibrarySort): string {
  const params = new URLSearchParams()
  if (kind !== 'seasons') params.set('tab', kind)
  if (search) params.set('q', search)
  if (sort !== 'date') params.set('sort', sort)
  const query = params.toString()
  return query ? `${ROUTES.seasons}?${query}` : ROUTES.seasons
}

/**
 * Строка списка. Оба списка сводятся к ней заранее: свои сезоны лежат теперь в
 * своей таблице и адресуются кодом, отложенное чужое — пока по-старому адресом.
 */
interface RowData {
  code: string
  title: string
  savedAt: Date
  palette: PaletteId
  month: string | null
  /** У отложенного и выложенного: сезон сняли с витрины, но ссылка работает. */
  hidden?: boolean
  /** Только у своих публикаций: закрыта после разбора жалоб. */
  blocked?: boolean
  /** Только у своих публикаций: что они собрали у людей. */
  likes?: number
  favorites?: number
  forks?: number
}

function Row({ entry, kind, back }: { entry: RowData; kind: Tab; back: string }) {
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
        {/* Закрытый сезон не открывается нигде — ссылка вела бы в 404. */}
        {entry.blocked ? (
          <span className={styles.entryTitle}>{entry.title}</span>
        ) : (
          <a
            className={styles.entryTitle}
            href={kind === 'seasons' ? seasonHref(entry.code) : publicSeasonHref(entry.code)}
          >
            {entry.title}
          </a>
        )}
        <span className={styles.entryMeta}>
          {kind === 'seasons' ? 'сохранён' : kind === 'favorites' ? 'отложен' : 'выложен'}{' '}
          {savedOn(entry.savedAt)}
          {entry.month ? ` · ${entry.month}` : ''}
          {/* Снятое с витрины остаётся в избранном и открывается по ссылке —
              но сказать об этом надо: в «Идеях» его больше нет. */}
          {/* Разделитель — снаружи пометки: у `.offStage` `display: inline-flex`,
              а флекс-контейнер срезает ведущий пробел внутри себя. */}
          {(entry.blocked || entry.hidden) && ' · '}
          {entry.blocked ? (
            <span className={styles.offStage}>закрыт после жалоб</span>
          ) : (
            entry.hidden && <span className={styles.offStage}>снят с витрины</span>
          )}
        </span>
        {/* Числа автору показываем всегда, включая нули: это его собственные
            данные, а не оценка. «В избранном» стоит рядом не для красоты —
            именно оно решает, исчезнет публикация при снятии или спрячется.

            Своей строкой и одинаковыми парами «слово: число»: в общей подписи
            они собирались в хвост из даты, месяца, сердца и двух разных по
            складу фраз, а сердце вдобавок сбивало числу базовую линию. */}
        {kind === 'published' && (
          <span className={styles.entryStats}>
            лайков: {entry.likes} · в избранном: {entry.favorites} · форков: {entry.forks}
          </span>
        )}
      </span>
      <span className={styles.rowTools}>
        {kind === 'seasons' && (
          <>
            <RenameEntry code={entry.code} title={entry.title} back={back} />
            <DeleteEntry code={entry.code} title={entry.title} back={back} />
          </>
        )}
        {/* Убрать закладку — не удаление: сам сезон никуда не денется, и
            спрашивать подтверждение не о чем. */}
        {kind === 'favorites' && (
          <UnfavoriteEntry code={entry.code} title={entry.title} back={back} />
        )}
        {/* Снять с витрины можно только то, что на ней есть: у снятого кнопки
            нет вовсе — погашенная обещала бы, что когда-нибудь оживёт. */}
        {kind === 'published' && !entry.hidden && !entry.blocked && (
          <WithdrawEntry
            code={entry.code}
            title={entry.title}
            back={back}
          />
        )}
      </span>
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
 * обязан открываться. Список у него тот же самый, только короткий — черновик в
 * браузере один; отдельной страницы входа поэтому не нужно, а вход предлагает
 * окно заведения сезона, когда до него дойдёт дело.
 */
export default async function SeasonsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string; sort?: string; add?: string }>
}) {
  const session = await auth()
  // Имя из сессии больше нигде не нужно: страница здоровается не с человеком,
  // а показывает его список. Остаётся сам факт входа — от него зависит, где
  // лежат сезоны: строками в базе или единственным черновиком в браузере.
  const signedIn = Boolean(session?.user?.name || session?.user?.email)

  if (!signedIn) {
    return (
      <PaperSheet>
        <SectionBox accent="deep" label="Мои сезоны" className={styles.section}>

          {/* Список у невошедшего тот же самый, просто короткий: черновик здесь
              один. Про вход разговор ведёт окно заведения сезона — оно и так
              всегда говорит, что без входа сезон живёт только в этом браузере,
              а вторая проповедь на пустой странице ничего не добавляет.

              Черновик лежит в браузере, поэтому строку рисует клиент. Вкладок
              анониму не показываем: избранного и публикаций без входа не бывает. */}
          <DraftEntry />

          <NewSeasonAction className={styles.primary}>Создать новый сезон</NewSeasonAction>
        </SectionBox>
      </PaperSheet>
    )
  }

  const flags = await searchParams
  // Вкладка приходит из адреса: неизвестная — как будто её не называли.
  const kind: Tab =
    flags.tab === 'favorites' || flags.tab === 'published' ? flags.tab : 'seasons'
  const sort: LibrarySort = flags.sort === 'name' ? 'name' : 'date'
  // Строку поиска режем по тому же пределу, что и название: искать длиннее нечего.
  const search = typeof flags.q === 'string' ? flags.q.slice(0, TITLE_LIMIT) : ''
  const here = listHref(kind, search, sort)
  const state =
    kind === 'seasons'
      ? await listUserSeasons(search, sort)
      : kind === 'favorites'
        ? await listFavorites(search, sort)
        : await listPublished(search, sort)
  const entries: RowData[] = state.status === 'ok' ? state.entries : []

  return (
    <PaperSheet>
      <SectionBox accent="deep" label="Мои сезоны" className={styles.section}>

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
          (entries.length ? (
            <ul className={styles.entries}>
              {entries.map((entry) => (
                <Row key={entry.code} entry={entry} kind={kind} back={here} />
              ))}
            </ul>
          ) : (
            <p className={styles.hand}>
              {search
                ? 'По этому запросу ничего не нашлось.'
                : kind === 'seasons'
                  ? EMPTY_LIST
                  : kind === 'favorites'
                    ? 'В избранном пока пусто. Нажмите ☆ на любом сезоне с витрины.'
                    : 'Вы ещё ничего не выкладывали. Откройте свой сезон и нажмите кнопку с мегафоном.'}
            </p>
          ))}

        {state.status === 'stale' && (
          <div className={styles.warn}>
            <p className={styles.text}>
              Вход был выполнен до того, как появился кабинет, и привязать сезоны не к чему.
              Лечится одним повторным входом.
            </p>
            <GoogleLoginButton label="Войти заново" />
          </div>
        )}

        {/* Имя спрашивается окном, и только потом заводится строка: молча
            заведённый сезон слишком похож на промах по кнопке. */}
        <NewSeasonAction className={styles.primary}>Создать новый сезон</NewSeasonAction>

        {state.status === 'error' && (
          <Toast message="Не удалось загрузить список — ошибка на сервере." />
        )}

        {/* Сюда возвращается неудача «Нового сезона»: строку завести не вышло, и
            человек оказался здесь вместо своего сезона — молчать об этом нельзя. */}
        {flags.add === 'limit' && (
          <Toast
            message={`Больше ${LIBRARY_LIMIT} сезонов на аккаунт мы не храним — удалите лишние.`}
          />
        )}
        {flags.add && flags.add !== 'limit' && (
          <Toast message="Не удалось завести сезон — ошибка на сервере." />
        )}
      </SectionBox>
    </PaperSheet>
  )
}
