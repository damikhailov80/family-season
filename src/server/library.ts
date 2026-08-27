import { auth } from './auth'
import { query } from './db'
import { logger } from './logger'
import { decodeTemplate, readHashPayload, readPaletteId } from '../model/codec'
import { monthName } from '../model/calendar'
import {
  hashOf,
  LIBRARY_LIMIT,
  normalizeTitle,
  type LibraryKind,
  type LibrarySort,
  type LibraryStatus,
} from '../model/library'
import { DEFAULT_PALETTE } from '../model/palettes'
import type { PaletteId } from '../types'

/**
 * Библиотека сезонов: избранное и свои сохранённые постеры.
 *
 * Повадка ровно та же, что у `settings.ts`: каждая функция сама читает сессию,
 * а две беды из `db.ts` (`unconfigured` и `failed`) схлопываются наружу в один
 * статус `error` — человеку от разницы никакой пользы, разбираться в ней по
 * строке лога.
 *
 * Сайт обязан работать при мёртвой базе: точечные чтения отдают `null`, и это
 * значит «кнопки не будет», а не ошибку.
 */

export interface Entry {
  id: string
  title: string
  /** Относительный адрес постера, готовый к открытию и пересылке. */
  url: string
  savedAt: Date
  /** Тема из `p=` — кружок в списке красится ею, как всё остальное в проекте. */
  palette: PaletteId
  /** Месяц бланка: адрес и есть постер, второго источника не заводим. */
  month: string | null
}

export type LibraryState =
  | { status: 'anonymous' | 'stale' | 'error' }
  | { status: 'ok'; entries: Entry[] }

interface Row {
  id: string
  title: string
  url: string
  saved_at: Date
}

/** Пометка `s=` приходит из адреса — до базы её пускать нельзя: uuid там строгий. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function seasonIdOrNull(value: unknown): string | null {
  return typeof value === 'string' && UUID.test(value) ? value : null
}

/**
 * Имя таблицы и порядок подставляются в текст запроса, а не параметрами: и то и
 * другое приходит из закрытого союза (`LibraryKind`, `LibrarySort`), а не от
 * человека. Поиск, наоборот, идёт параметром — и через `position`, а не `ilike`,
 * чтобы не экранировать `%` и `_`, которые в строке поиска напечатают запросто.
 */
function listSql(kind: LibraryKind, sort: LibrarySort): string {
  const stamp = kind === 'seasons' ? 'updated_at' : 'created_at'
  const order = sort === 'name' ? `lower(title) asc, ${stamp} desc` : `${stamp} desc`
  return `select id, title, url, ${stamp} as saved_at
            from ${kind}
           where account_key = $1
             and ($2 = '' or position(lower($2) in lower(title)) > 0)
           order by ${order}
           limit ${LIBRARY_LIMIT}`
}

/**
 * Месяц и тема выводятся из сохранённого адреса, а не хранятся рядом с ним:
 * лишняя колонка была бы второй копией того, что уже лежит в `d=` и `p=`,
 * и однажды разошлась бы с ней. Декодирование не бросает и стоит дёшево,
 * а строк в списке не больше ста.
 */
async function toEntry(row: Row): Promise<Entry> {
  const hash = hashOf(row.url)
  const payload = readHashPayload(hash)
  const template = payload ? await decodeTemplate(payload) : null
  return {
    id: row.id,
    title: row.title,
    url: row.url,
    savedAt: row.saved_at,
    palette: readPaletteId(hash) ?? DEFAULT_PALETTE,
    month: template ? `${monthName(template.theme).toLowerCase()} ${template.theme.year}` : null,
  }
}

/** Список для страницы «Мои сезоны». Не кэшируется: после удаления нужен свежий. */
export async function libraryState(
  kind: LibraryKind,
  search: string,
  sort: LibrarySort,
): Promise<LibraryState> {
  const session = await auth()
  if (!session?.user) return { status: 'anonymous' }
  if (!session.accountKey) return { status: 'stale' }

  const result = await query<Row>(`${kind}:read`, listSql(kind, sort), [
    session.accountKey,
    search,
  ])
  if (result.status !== 'ok') return { status: 'error' }
  return { status: 'ok', entries: await Promise.all(result.rows.map(toEntry)) }
}

/** Для кнопки ★: id строки с этим адресом. `null` — в том числе когда не вошёл. */
export async function findFavorite(url: string): Promise<string | null> {
  const session = await auth()
  if (!session?.accountKey) return null

  const result = await query<{ id: string }>(
    'favorites:find',
    'select id from favorites where account_key = $1 and url = $2 limit 1',
    [session.accountKey, url],
  )
  return result.status === 'ok' && result.rows.length ? result.rows[0].id : null
}

/**
 * Своя сохранённая строка — по пометке `s=`, а если её нет, **по самому адресу**.
 *
 * Второй путь обязателен: пометка есть только у постера, открытого из кабинета.
 * Тот же самый сезон, пришедший обычной ссылкой (или открытый до входа), пометки
 * не несёт — и без поиска по адресу «Сохранить» завела бы вторую такую же строку.
 *
 * Чужой или выдуманный `s=` не находится: строка всегда ищется вместе с владельцем.
 */
export async function findSeason(
  id: unknown,
  url: unknown,
): Promise<{ id: string; title: string; url: string } | null> {
  const session = await auth()
  if (!session?.accountKey) return null

  const key = seasonIdOrNull(id)
  const address = typeof url === 'string' ? url : null
  if (!key && !address) return null

  const result = await query<{ id: string; title: string; url: string }>(
    'seasons:find',
    key
      ? 'select id, title, url from seasons where id = $2 and account_key = $1'
      : `select id, title, url from seasons
           where account_key = $1 and url = $2
           order by updated_at desc limit 1`,
    [session.accountKey, key ?? address],
  )
  return result.status === 'ok' && result.rows.length ? result.rows[0] : null
}

/**
 * Предел проверяется тем же запросом, что и вставка: между отдельными `count` и
 * `insert` есть окно, а два похода в базу на одно нажатие — лишние. Пустой `id`
 * в ответе и значит «мест больше нет».
 *
 * Повторное добавление того же адреса возвращает прежнюю строку: кнопка ★ и так
 * не даст этого сделать, но двойной клик не должен плодить дубли.
 */
export async function addFavorite(
  url: string,
  title: string,
): Promise<{ status: LibraryStatus; id?: string }> {
  const session = await auth()
  if (!session?.user) return { status: 'anonymous' }
  if (!session.accountKey) return { status: 'stale' }

  const result = await query<{ id: string | null }>(
    'favorites:add',
    `with existing as (
       select id from favorites where account_key = $1 and url = $2 limit 1
     ),
     room as (select count(*) < $4 as ok from favorites where account_key = $1),
     added as (
       insert into favorites (account_key, url, title)
       select $1, $2, $3
        where not exists (select 1 from existing) and (select ok from room)
       returning id
     )
     select coalesce((select id from existing), (select id from added)) as id`,
    [session.accountKey, url, normalizeTitle(title), LIBRARY_LIMIT],
  )

  if (result.status !== 'ok') return { status: failed('favorite not added', session.accountKey, result.status) }
  const id = result.rows[0]?.id
  return id ? { status: 'ok', id } : { status: 'limit' }
}

/**
 * Сохранение своего сезона. `id` есть — перезапись; строка не нашлась (удалили
 * в соседней вкладке, пометка чужая) — сохраняем как новый, а не молчим.
 */
export async function saveSeason(input: {
  id: string | null
  url: string
  title: string
}): Promise<{ status: LibraryStatus; id?: string }> {
  const session = await auth()
  if (!session?.user) return { status: 'anonymous' }
  if (!session.accountKey) return { status: 'stale' }

  const title = normalizeTitle(input.title)
  const id = seasonIdOrNull(input.id)

  if (id) {
    const updated = await query<{ id: string }>(
      'seasons:save',
      `update seasons set url = $2, title = $3, updated_at = now()
        where id = $4 and account_key = $1
        returning id`,
      [session.accountKey, input.url, title, id],
    )
    if (updated.status !== 'ok') {
      return { status: failed('season not saved', session.accountKey, updated.status) }
    }
    if (updated.rows.length) return { status: 'ok', id: updated.rows[0].id }
  }

  const result = await query<{ id: string | null }>(
    'seasons:add',
    `with room as (select count(*) < $4 as ok from seasons where account_key = $1),
     added as (
       insert into seasons (account_key, url, title)
       select $1, $2, $3 where (select ok from room)
       returning id
     )
     select (select id from added) as id`,
    [session.accountKey, input.url, title, LIBRARY_LIMIT],
  )

  if (result.status !== 'ok') {
    return { status: failed('season not saved', session.accountKey, result.status) }
  }
  const added = result.rows[0]?.id
  return added ? { status: 'ok', id: added } : { status: 'limit' }
}

/**
 * Переименование своей строки.
 *
 * `updated_at` намеренно не трогаем: это дата **сохранения**, по ней список
 * сортируется по умолчанию, и правка имени не должна поднимать сезон наверх —
 * сам сезон от неё не поменялся.
 */
export async function setTitle(
  kind: LibraryKind,
  id: string,
  title: string,
): Promise<LibraryStatus> {
  const session = await auth()
  if (!session?.user) return 'anonymous'
  if (!session.accountKey) return 'stale'
  if (!seasonIdOrNull(id)) return 'error'

  const result = await query(
    `${kind}:rename`,
    `update ${kind} set title = $3 where id = $1 and account_key = $2`,
    [id, session.accountKey, normalizeTitle(title)],
  )
  if (result.status === 'ok') return 'ok'
  return failed(`${kind} entry not renamed`, session.accountKey, result.status)
}

/** Удаление своей строки. Не нашлась — тоже `ok`: повторное удаление не беда. */
export async function removeEntry(kind: LibraryKind, id: string): Promise<LibraryStatus> {
  const session = await auth()
  if (!session?.user) return 'anonymous'
  if (!session.accountKey) return 'stale'
  if (!seasonIdOrNull(id)) return 'error'

  const result = await query(
    `${kind}:remove`,
    `delete from ${kind} where id = $1 and account_key = $2`,
    [id, session.accountKey],
  )
  if (result.status === 'ok') return 'ok'
  return failed(`${kind} entry not removed`, session.accountKey, result.status)
}

/**
 * Чей именно сезон пропал, из лога `db.ts` не видно: там операция, но не
 * владелец. Ключ непрозрачный, тот же, что лежит в базе, — ни имени, ни почты.
 */
function failed(message: string, accountKey: string, reason: string): 'error' {
  logger.error(message, { accountKey, reason })
  return 'error'
}
