import { cache } from 'react'
import { auth } from './auth'
import { query } from './db'
import { logger } from './logger'
import { monthInText, monthName } from '../model/calendar'
import { knownIconSet } from '../model/icons'
import { knownLang, type Lang } from '../model/lang'
import { posterText } from '../model/labels'
import {
  LIBRARY_LIMIT,
  normalizeTitle,
  type LibrarySort,
  type LibraryStatus,
} from '../model/library'
import { knownPalette } from '../model/palettes'
import { joinSeason, splitSeason } from '../model/season'
import { codeOrNull, shareToken, shortCode, tokenOrNull } from '../model/shortcode'
import type { Template } from '../model/types'
import type { IconSetId, PaletteId } from '../types'

/**
 * Уникальности содержимого здесь нет и быть не должно: форк своего же сезона —
 * законная вторая строка, как и два сезона с одинаковым названием.
 */

export interface UserSeason {
  code: string
  title: string
  template: Template
  palette: PaletteId
  iconSet: IconSetId
  /** Ставится при заведении и не правится: подписи листа печатаются. */
  lang: Lang
  shareToken: string | null
}

export type UserSeasonState =
  | { status: 'ok'; season: UserSeason }
  | { status: 'anonymous' }
  | { status: 'missing' }
  | { status: 'error' }

export interface UserSeasonEntry {
  code: string
  title: string
  savedAt: Date
  palette: PaletteId
  /** Выводится из содержимого, отдельной колонкой не лежит. */
  month: string | null
  lang: Lang
}

export type UserSeasonsState =
  { status: 'ok'; entries: UserSeasonEntry[] } | { status: 'anonymous' | 'stale' | 'error' }

interface Row {
  code: string
  title: string
  content: unknown
  names: unknown
  palette: string
  icon_set: string
  language: string
  updated_at?: Date
  share_token?: string | null
}

/**
 * Строка ищется вместе с владельцем: чужой код неотличим от выдуманного — по
 * ответу не должно быть видно, существует ли чужой сезон.
 *
 * `cache()` из React: за один запрос сезон спрашивают и заголовок страницы, и
 * сама страница. Между запросами кэш не живёт — сезон могли поправить в соседней
 * вкладке.
 */
export const readUserSeason = cache(async function readUserSeason(
  value: string,
): Promise<UserSeasonState> {
  const code = codeOrNull(value)
  if (!code) return { status: 'missing' }

  const session = await auth()
  if (!session?.user) return { status: 'anonymous' }
  if (!session.accountKey) return { status: 'anonymous' }

  const result = await query<Row>(
    'user-seasons:read',
    `select code, title, content, names, palette, icon_set, language, share_token
       from user_seasons where code = $1 and account_key = $2`,
    [code, session.accountKey],
  )
  if (result.status !== 'ok') {
    logger.error('user season not read', { code, reason: result.status })
    return { status: 'error' }
  }

  const row = result.rows[0]
  if (!row) return { status: 'missing' }
  return {
    status: 'ok',
    season: {
      code: row.code,
      title: row.title,
      template: joinSeason(row.content, row.names),
      palette: knownPalette(row.palette),
      iconSet: knownIconSet(row.icon_set),
      lang: knownLang(row.language),
      shareToken: row.share_token ?? null,
    },
  }
})

/**
 * Список для кабинета. Поиск идёт через `position`, а не `ilike`: не приходится
 * экранировать `%` и `_`, которые в строке поиска напечатают запросто. Порядок
 * подставляется в текст запроса, но из закрытого союза, а не от человека.
 */
export async function listUserSeasons(
  search: string,
  sort: LibrarySort,
): Promise<UserSeasonsState> {
  const session = await auth()
  if (!session?.user) return { status: 'anonymous' }
  if (!session.accountKey) return { status: 'stale' }

  const order = sort === 'name' ? 'lower(title) asc, updated_at desc' : 'updated_at desc'
  const result = await query<Row>(
    'user-seasons:list',
    `select code, title, content, names, palette, icon_set, language, updated_at
       from user_seasons
      where account_key = $1
        and ($2 = '' or position(lower($2) in lower(title)) > 0)
      order by ${order}
      limit ${LIBRARY_LIMIT}`,
    [session.accountKey, search],
  )
  if (result.status !== 'ok') {
    logger.error('user seasons not listed', {
      accountKey: session.accountKey,
      reason: result.status,
    })
    return { status: 'error' }
  }

  return { status: 'ok', entries: result.rows.map(toEntry) }
}

function toEntry(row: Row): UserSeasonEntry {
  const template = joinSeason(row.content, [])
  const lang = knownLang(row.language)
  return {
    code: row.code,
    title: row.title,
    savedAt: row.updated_at!,
    palette: knownPalette(row.palette),
    // Месяц назван языком сезона: русский и в английском кабинете сентябрьский.
    month: `${monthInText(monthName(template.theme, lang), lang)} ${template.theme.year}`,
    lang,
  }
}

/**
 * Код считается из id, а id берётся заранее: `insert ... returning` отдал бы его,
 * когда строка уже записана, и код пришлось бы дописывать вторым запросом.
 *
 * Предел проверяется тем же оператором, что и вставка: между отдельными `count`
 * и `insert` есть окно.
 */
export async function createUserSeason(input: {
  title: string
  template: Template
  palette: PaletteId
  iconSet: IconSetId
  lang: Lang
}): Promise<{ status: LibraryStatus; code?: string }> {
  const session = await auth()
  if (!session?.user) return { status: 'anonymous' }
  if (!session.accountKey) return { status: 'stale' }

  const next = await query<{ id: string }>(
    'user-seasons:id',
    "select nextval(pg_get_serial_sequence('user_seasons', 'id')) as id",
  )
  if (next.status !== 'ok' || !next.rows[0]) {
    logger.error('season id not taken', { accountKey: session.accountKey, reason: next.status })
    return { status: 'error' }
  }

  const id = Number(next.rows[0].id)
  const code = shortCode('season', id)
  const { content, names } = splitSeason(input.template)

  const result = await query<{ code: string | null }>(
    'user-seasons:create',
    `with room as (select count(*) < $10 as ok from user_seasons where account_key = $1),
     added as (
       insert into user_seasons
         (id, code, account_key, title, content, names, palette, icon_set, language)
       select $2, $3, $1, $4, $5::jsonb, $6::jsonb, $7, $8, $9 where (select ok from room)
       returning code
     )
     select (select code from added) as code`,
    [
      session.accountKey,
      id,
      code,
      normalizeTitle(input.title, posterText(input.lang).untitled),
      JSON.stringify(content),
      JSON.stringify(names),
      input.palette,
      input.iconSet,
      input.lang,
      LIBRARY_LIMIT,
    ],
  )
  if (result.status !== 'ok') {
    logger.error('season not created', { accountKey: session.accountKey, reason: result.status })
    return { status: 'error' }
  }
  const added = result.rows[0]?.code
  return added ? { status: 'ok', code: added } : { status: 'limit' }
}

export async function saveUserSeason(
  value: string,
  input: { template: Template; palette: PaletteId; iconSet: IconSetId },
): Promise<LibraryStatus> {
  const code = codeOrNull(value)
  const session = await auth()
  if (!session?.user) return 'anonymous'
  if (!session.accountKey) return 'stale'
  if (!code) return 'error'

  const { content, names } = splitSeason(input.template)
  const result = await query(
    'user-seasons:save',
    `update user_seasons
        set content = $3::jsonb, names = $4::jsonb, palette = $5, icon_set = $6, updated_at = now()
      where code = $1 and account_key = $2`,
    [
      code,
      session.accountKey,
      JSON.stringify(content),
      JSON.stringify(names),
      input.palette,
      input.iconSet,
    ],
  )
  if (result.status === 'ok') return 'ok'
  logger.error('season not saved', { code, reason: result.status })
  return 'error'
}

/**
 * `updated_at` намеренно не трогаем: это дата правки сезона, по ней сортируется
 * список, и смена имени не должна поднимать строку наверх. Язык нужен только
 * запасному имени — оно берётся языком сезона, а не переименовывающего.
 */
export async function renameUserSeason(
  value: string,
  title: string,
  lang: Lang,
): Promise<LibraryStatus> {
  const code = codeOrNull(value)
  const session = await auth()
  if (!session?.user) return 'anonymous'
  if (!session.accountKey) return 'stale'
  if (!code) return 'error'

  const result = await query(
    'user-seasons:rename',
    'update user_seasons set title = $3 where code = $1 and account_key = $2',
    [code, session.accountKey, normalizeTitle(title, posterText(lang).untitled)],
  )
  if (result.status === 'ok') return 'ok'
  logger.error('season not renamed', { code, reason: result.status })
  return 'error'
}

/** Не нашлось — тоже `ok`: повторное удаление не беда. */
export async function removeUserSeason(value: string): Promise<LibraryStatus> {
  const code = codeOrNull(value)
  const session = await auth()
  if (!session?.user) return 'anonymous'
  if (!session.accountKey) return 'stale'
  if (!code) return 'error'

  const result = await query(
    'user-seasons:remove',
    'delete from user_seasons where code = $1 and account_key = $2',
    [code, session.accountKey],
  )
  if (result.status === 'ok') return 'ok'
  logger.error('season not removed', { code, reason: result.status })
  return 'error'
}

/**
 * Читается без входа и без владельца: в том и смысл ссылки — её отправляют тому,
 * у кого аккаунта нет. Отозванная ссылка неотличима от выдуманной.
 */
export async function readSharedSeason(value: string): Promise<UserSeasonState> {
  const token = tokenOrNull(value)
  if (!token) return { status: 'missing' }

  const result = await query<Row>(
    'user-seasons:shared',
    `select code, title, content, names, palette, icon_set, language, share_token
       from user_seasons where share_token = $1`,
    [token],
  )
  if (result.status !== 'ok') {
    logger.error('shared season not read', { reason: result.status })
    return { status: 'error' }
  }

  const row = result.rows[0]
  if (!row) return { status: 'missing' }
  return {
    status: 'ok',
    season: {
      code: row.code,
      title: row.title,
      template: joinSeason(row.content, row.names),
      palette: knownPalette(row.palette),
      iconSet: knownIconSet(row.icon_set),
      lang: knownLang(row.language),
      shareToken: token,
    },
  }
}

/**
 * Одно действие на «создать» и «выдать новую»: прежний токен в обоих случаях
 * перестаёт работать. Отозвать ссылку можно ровно потому, что токен не выведен
 * из id, а лежит в своей колонке.
 */
export async function refreshShareToken(
  value: string,
): Promise<{ status: LibraryStatus; token?: string }> {
  const code = codeOrNull(value)
  const session = await auth()
  if (!session?.user) return { status: 'anonymous' }
  if (!session.accountKey) return { status: 'stale' }
  if (!code) return { status: 'error' }

  const token = shareToken()
  const result = await query<{ share_token: string }>(
    'user-seasons:share',
    `update user_seasons set share_token = $3
      where code = $1 and account_key = $2
      returning share_token`,
    [code, session.accountKey, token],
  )
  if (result.status !== 'ok' || !result.rows.length) {
    logger.error('share link not issued', { code, reason: result.status })
    return { status: 'error' }
  }
  return { status: 'ok', token: result.rows[0].share_token }
}

export async function dropShareToken(value: string): Promise<LibraryStatus> {
  const code = codeOrNull(value)
  const session = await auth()
  if (!session?.user) return 'anonymous'
  if (!session.accountKey) return 'stale'
  if (!code) return 'error'

  const result = await query(
    'user-seasons:unshare',
    'update user_seasons set share_token = null where code = $1 and account_key = $2',
    [code, session.accountKey],
  )
  if (result.status === 'ok') return 'ok'
  logger.error('share link not revoked', { code, reason: result.status })
  return 'error'
}
