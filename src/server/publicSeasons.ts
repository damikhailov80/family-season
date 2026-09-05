import { cache } from 'react'
import { auth } from './auth'
import { query } from './db'
import { logger } from './logger'
import { monthInText, monthName } from '../model/calendar'
import {
  IDEAS_PAGE,
  PUBLISH_LIMIT,
  type PublishStatus,
  type ReactionStatus,
} from '../model/community'
import { knownIconSet } from '../model/icons'
import { knownLang, type Lang } from '../model/lang'
import { defaultSeasonTitle, ideaTitle, LIBRARY_LIMIT, type LibrarySort } from '../model/library'
import { knownPalette } from '../model/palettes'
import { anonymousNames, joinSeason, withTargetMonth } from '../model/season'
import { codeOrNull, shortCode } from '../model/shortcode'
import type { Template } from '../model/types'
import type { IconSetId, PaletteId } from '../types'

export interface PublicSeasonView {
  code: string
  template: Template
  palette: PaletteId
  iconSet: IconSetId
  lang: Lang
  fillId: string | null
  mine: boolean
  system: boolean
  hidden: boolean
  likes: number
  liked: boolean
  reported: boolean
  favorited: boolean
}

export type PublicSeasonState =
  { status: 'ok'; season: PublicSeasonView } | { status: 'missing' } | { status: 'error' }

interface Row {
  code: string
  content: unknown
  names: unknown
  palette: string
  icon_set: string
  language: string
  fill_id: string | null
  rolling_month: boolean
  author_key: string | null
  hidden_at: Date | null
  blocked_at: Date | null
  likes: number
  liked: boolean
  reported: boolean
  favorited: boolean
}

export const readPublicSeason = cache(
  async (value: string, lang: Lang): Promise<PublicSeasonState> => {
    const code = codeOrNull(value)
    if (!code) return { status: 'missing' }

    const session = await auth()
    const me = session?.accountKey ?? ''
    const result = await query<Row>(
      'public:read',
      `select p.code, p.content, p.names, p.palette, p.icon_set, p.language, p.fill_id, p.rolling_month,
            p.author_key, p.hidden_at, p.blocked_at,
            (select count(*) from public_likes l where l.public_id = p.id)::int as likes,
            exists(select 1 from public_likes l
                    where l.public_id = p.id and l.account_key = $2) as liked,
            exists(select 1 from public_reports r
                    where r.code = p.code and r.reporter_key = $2) as reported,
            exists(select 1 from public_favorites f
                    where f.public_id = p.id and f.account_key = $2) as favorited
       from public_seasons p where p.code = $1 and p.language = $3`,
      [code, me, lang],
    )
    if (result.status !== 'ok') {
      logger.error('public season not read', { code, reason: result.status })
      return { status: 'error' }
    }

    const row = result.rows[0]
    if (!row) return { status: 'missing' }
    if (row.blocked_at) return { status: 'missing' }

    const template = joinSeason(row.content, row.names)
    return {
      status: 'ok',
      season: {
        code: row.code,
        template: row.rolling_month ? withTargetMonth(template) : template,
        palette: knownPalette(row.palette),
        iconSet: knownIconSet(row.icon_set),
        lang: knownLang(row.language),
        fillId: row.fill_id,
        mine: Boolean(row.author_key) && row.author_key === session?.accountKey,
        system: !row.author_key,
        hidden: Boolean(row.hidden_at),
        likes: row.likes,
        liked: row.liked,
        reported: row.reported,
        favorited: row.favorited,
      },
    }
  },
)

export async function noteFork(value: string): Promise<void> {
  const code = codeOrNull(value)
  if (!code) return

  const session = await auth()
  if (!session?.accountKey) return

  await query(
    'public:fork',
    `insert into public_forks (public_id, account_key)
     select id, $2 from public_seasons
      where code = $1 and author_key is distinct from $2
     on conflict do nothing`,
    [code, session.accountKey],
  )
}

export async function previewPublish(
  value: string,
  lang: Lang,
): Promise<{ status: PublishStatus; code?: string }> {
  const code = codeOrNull(value)
  const session = await auth()
  if (!session?.user) return { status: 'anonymous' }
  if (!session.accountKey) return { status: 'stale' }
  if (!code) return { status: 'error' }

  const result = await query<{
    found: number
    existing: string | null
    off: boolean
    blocked: boolean
    own: boolean
    room: boolean
  }>(
    'public:publish:preview',
    `with mine as (select content from user_seasons where code = $1 and account_key = $2),
     existing as (
       select code, hidden_at, blocked_at, author_key = $2 as own
         from public_seasons
        where content_key = md5($4 || (select content from mine)::text)
     ),
     room as (
       select count(*) < $3 as ok from public_seasons
        where author_key = $2 and hidden_at is null and blocked_at is null
     )
     select (select count(*) from mine)::int as found,
            (select code from existing) as existing,
            coalesce((select hidden_at is not null from existing), false) as off,
            coalesce((select blocked_at is not null from existing), false) as blocked,
            coalesce((select own from existing), false) as own,
            (select ok from room) as room`,
    [code, session.accountKey, PUBLISH_LIMIT, lang],
  )
  if (result.status !== 'ok') {
    logger.error('publish not previewed', { code, reason: result.status })
    return { status: 'error' }
  }

  const row = result.rows[0]
  if (!row?.found) return { status: 'error' }
  if (row.blocked) return { status: 'blocked' }
  if (row.existing && !row.off) return { status: 'duplicate', code: row.existing }
  if (row.existing && !row.own) return { status: 'duplicate' }
  if (row.room === false) return { status: 'limit' }
  return { status: 'ok' }
}

export async function publishSeason(
  value: string,
  anonymize: boolean,
  lang: Lang,
): Promise<{ status: PublishStatus; code?: string; fresh?: boolean }> {
  const code = codeOrNull(value)
  const session = await auth()
  if (!session?.user) return { status: 'anonymous' }
  if (!session.accountKey) return { status: 'stale' }
  if (!code) return { status: 'error' }

  const mine = await query<{ names: unknown; id: string }>(
    'public:publish:mine',
    `select names, nextval(pg_get_serial_sequence('public_seasons', 'id')) as id
       from user_seasons where code = $1 and account_key = $2`,
    [code, session.accountKey],
  )
  if (mine.status !== 'ok') {
    logger.error('season not published', { code, reason: mine.status })
    return { status: 'error' }
  }
  const row = mine.rows[0]
  if (!row) return { status: 'error' }

  const names = Array.isArray(row.names) ? row.names : []
  const shown = anonymize ? anonymousNames(names.length, lang) : names
  const id = Number(row.id)

  const result = await query<{
    room: boolean
    added: string | null
    taken: string | null
    existing: string | null
    blocked: boolean | null
    off: boolean | null
  }>(
    'public:publish',
    `with mine as (
       select content, palette, icon_set from user_seasons where code = $1 and account_key = $2
     ),
     key as (select md5($7 || (select content from mine)::text) as value),
     existing as (
       select code, blocked_at, hidden_at
         from public_seasons where content_key = (select value from key)
     ),
     room as (
       select count(*) < $6 as ok from public_seasons
        where author_key = $2 and hidden_at is null and blocked_at is null
     ),
     taken as (
       update public_seasons
          set author_key = $2,
              names = $5::jsonb,
              palette = (select palette from mine),
              icon_set = (select icon_set from mine),
              hidden_at = null
        where content_key = (select value from key)
          and hidden_at is not null
          and blocked_at is null
          and author_key = $2
          and (select ok from room)
       returning code
     ),
     added as (
       insert into public_seasons
         (id, code, author_key, content, names, palette, icon_set, language)
       select $3, $4, $2, m.content, $5::jsonb, m.palette, m.icon_set, $7 from mine m
        where (select ok from room) and not exists (select 1 from existing)
       returning code
     )
     select (select ok from room) as room,
            (select code from added) as added,
            (select code from taken) as taken,
            (select code from existing) as existing,
            (select blocked_at is not null from existing) as blocked,
            (select hidden_at is not null from existing) as off`,
    [
      code,
      session.accountKey,
      id,
      shortCode('public', id),
      JSON.stringify(shown),
      PUBLISH_LIMIT,
      lang,
    ],
  )
  if (result.status !== 'ok') {
    logger.error('season not published', { code, reason: result.status })
    return { status: 'error' }
  }

  const outcome = result.rows[0]
  const fresh = outcome?.added ?? outcome?.taken
  if (fresh) return { status: 'ok', code: fresh, fresh: true }
  if (outcome?.blocked) return { status: 'blocked' }
  if (outcome?.existing && !outcome.off) return { status: 'duplicate', code: outcome.existing }
  if (outcome?.room === false) return { status: 'limit' }
  return { status: outcome?.existing ? 'duplicate' : 'error' }
}

export async function withdrawPublic(
  value: string,
): Promise<{ status: PublishStatus; hidden?: boolean }> {
  const code = codeOrNull(value)
  const session = await auth()
  if (!session?.user) return { status: 'anonymous' }
  if (!session.accountKey) return { status: 'stale' }
  if (!code) return { status: 'error' }

  const found = await query<{ id: string; held: boolean }>(
    'public:withdraw:find',
    `select p.id,
            exists(select 1 from public_favorites f where f.public_id = p.id) as held
       from public_seasons p
      where p.code = $1 and p.author_key = $2`,
    [code, session.accountKey],
  )
  if (found.status !== 'ok') {
    logger.error('season not withdrawn', { code, reason: found.status })
    return { status: 'error' }
  }
  const row = found.rows[0]
  if (!row) return { status: 'error' }

  const result = row.held
    ? await query('public:hide', 'update public_seasons set hidden_at = now() where id = $1', [
        row.id,
      ])
    : await query('public:drop', 'delete from public_seasons where id = $1', [row.id])

  if (result.status !== 'ok') {
    logger.error('season not withdrawn', { code, reason: result.status })
    return { status: 'error' }
  }
  return { status: 'ok', hidden: row.held }
}

export async function republishPublic(value: string): Promise<PublishStatus> {
  const code = codeOrNull(value)
  const session = await auth()
  if (!session?.user) return 'anonymous'
  if (!session.accountKey) return 'stale'
  if (!code) return 'error'

  const result = await query<{
    found: number
    blocked: boolean
    shown: boolean
    room: boolean
    back: string | null
  }>(
    'public:republish',
    `with post as (
       select id, hidden_at, blocked_at from public_seasons
        where code = $1 and author_key = $2
     ),
     room as (
       select count(*) < $3 as ok from public_seasons
        where author_key = $2 and hidden_at is null and blocked_at is null
     ),
     back as (
       update public_seasons set hidden_at = null
        where id = (select id from post)
          and hidden_at is not null
          and blocked_at is null
          and (select ok from room)
       returning code
     )
     select (select count(*) from post)::int as found,
            coalesce((select blocked_at is not null from post), false) as blocked,
            coalesce((select hidden_at is null from post), false) as shown,
            (select ok from room) as room,
            (select code from back) as back`,
    [code, session.accountKey, PUBLISH_LIMIT],
  )
  if (result.status !== 'ok') {
    logger.error('season not republished', { code, reason: result.status })
    return 'error'
  }

  const row = result.rows[0]
  if (!row?.found) return 'error'
  if (row.back || row.shown) return 'ok'
  if (row.blocked) return 'blocked'
  return row.room === false ? 'limit' : 'error'
}

function monthOf(template: Template, lang: Lang): string {
  return `${monthInText(monthName(template.theme, lang), lang)} ${template.theme.year}`
}

export interface Idea {
  code: string
  title: string
  palette: PaletteId
  template: Template
  lang: Lang
  likes: number
  system: boolean
}

export type IdeasState = { status: 'ok'; ideas: Idea[] } | { status: 'error' }

export async function randomIdeas(lang: Lang): Promise<IdeasState> {
  const result = await query<{
    code: string
    content: unknown
    names: unknown
    palette: string
    language: string
    rolling_month: boolean
    likes: number
    system: boolean
  }>(
    'public:ideas',
    `select p.code, p.content, p.names, p.palette, p.language, p.rolling_month,
            p.author_key is null as system,
            (select count(*) from public_likes l where l.public_id = p.id)::int as likes
       from public_seasons p
      where p.hidden_at is null and p.blocked_at is null and p.language = $2
      order by power(
                 random(),
                 1.0 / (1 + (select count(*) from public_likes l where l.public_id = p.id))
               ) desc
      limit $1`,
    [IDEAS_PAGE, lang],
  )

  if (result.status !== 'ok') {
    logger.error('ideas not read', { reason: result.status })
    return { status: 'error' }
  }

  return {
    status: 'ok',
    ideas: result.rows.map((row) => {
      const template = joinSeason(row.content, row.names)
      const shown = row.rolling_month ? withTargetMonth(template) : template
      return {
        code: row.code,
        title: ideaTitle(shown, knownLang(row.language)),
        palette: knownPalette(row.palette),
        lang: knownLang(row.language),
        template: shown,
        likes: row.likes,
        system: row.system,
      }
    }),
  }
}

// The month page shows named seasons rather than a random draw, so it asks for them by code.
// It could have drawn them from the example files - they are in the repository - but then the
// card would come from one place and the link it carries from another, and the two are bound to
// part: a season taken off the showcase, or closed after reports, would still be advertised
// here. One source, and the visibility rules are the showcase's own.
export async function ideasByCode(codes: string[], lang: Lang): Promise<IdeasState> {
  if (!codes.length) return { status: 'ok', ideas: [] }

  const result = await query<{
    code: string
    content: unknown
    names: unknown
    palette: string
    language: string
    rolling_month: boolean
    likes: number
    system: boolean
  }>(
    'public:ideas:codes',
    `select p.code, p.content, p.names, p.palette, p.language, p.rolling_month,
            p.author_key is null as system,
            (select count(*) from public_likes l where l.public_id = p.id)::int as likes
       from public_seasons p
      where p.hidden_at is null and p.blocked_at is null
        and p.language = $2 and p.code = any($1)`,
    [codes, lang],
  )

  if (result.status !== 'ok') {
    logger.error('month ideas not read', { reason: result.status })
    return { status: 'error' }
  }

  const found = new Map(
    result.rows.map((row) => {
      const template = joinSeason(row.content, row.names)
      const shown = row.rolling_month ? withTargetMonth(template) : template
      return [
        row.code,
        {
          code: row.code,
          title: ideaTitle(shown, knownLang(row.language)),
          palette: knownPalette(row.palette),
          lang: knownLang(row.language),
          template: shown,
          likes: row.likes,
          system: row.system,
        } satisfies Idea,
      ]
    }),
  )

  // The order is the one the month page asked for, not the one the database happened to return.
  return { status: 'ok', ideas: codes.map((code) => found.get(code)).filter(Boolean) as Idea[] }
}

export async function setLike(value: string, on: boolean): Promise<ReactionStatus> {
  const code = codeOrNull(value)
  const session = await auth()
  if (!session?.user) return 'anonymous'
  if (!session.accountKey) return 'stale'
  if (!code) return 'error'

  if (!on) {
    const removed = await query(
      'public:unlike',
      `delete from public_likes
        where account_key = $2
          and public_id = (select id from public_seasons where code = $1)`,
      [code, session.accountKey],
    )
    if (removed.status === 'ok') return 'ok'
    return reacted('like not removed', code, removed.status)
  }

  const result = await query<Verdict>(
    'public:like',
    `with post as (select id, author_key, blocked_at from public_seasons where code = $1),
     added as (
       insert into public_likes (public_id, account_key)
       select id, $2 from post where author_key is distinct from $2 and blocked_at is null
       on conflict do nothing
       returning 1
     )
     select (select count(*) from post)::int as found,
            coalesce((select author_key = $2 from post), false) as own,
            coalesce((select blocked_at is not null from post), false) as blocked`,
    [code, session.accountKey],
  )
  if (result.status !== 'ok') return reacted('like not added', code, result.status)
  return verdict(result.rows[0])
}

export async function setFavorite(value: string, on: boolean): Promise<ReactionStatus> {
  const code = codeOrNull(value)
  const session = await auth()
  if (!session?.user) return 'anonymous'
  if (!session.accountKey) return 'stale'
  if (!code) return 'error'

  if (!on) {
    const removed = await query(
      'public:unfavorite',
      `with post as (
         select id, hidden_at, blocked_at from public_seasons where code = $1
       ),
       mine as (
         select 1 from public_favorites
          where account_key = $2 and public_id = (select id from post)
       ),
       gone as (
         delete from public_favorites
          where account_key = $2 and public_id = (select id from post)
       )
       delete from public_seasons p
        where p.id = (select id from post)
          and p.hidden_at is not null
          and p.blocked_at is null
          and exists (select 1 from mine)
          and not exists (
            select 1 from public_favorites f
             where f.public_id = p.id and f.account_key <> $2
          )`,
      [code, session.accountKey],
    )
    if (removed.status === 'ok') return 'ok'
    return reacted('favorite not removed', code, removed.status)
  }

  const result = await query<Verdict & { room: boolean; held: boolean }>(
    'public:favorite',
    `with post as (select id, author_key, blocked_at from public_seasons where code = $1),
     held as (
       select exists(
         select 1 from public_favorites
          where account_key = $2 and public_id = (select id from post)
       ) as yes
     ),
     room as (select count(*) < $3 as ok from public_favorites where account_key = $2),
     added as (
       insert into public_favorites (account_key, public_id)
       select $2, id from post
        where author_key is distinct from $2 and blocked_at is null and (select ok from room)
       on conflict do nothing
       returning 1
     )
     select (select count(*) from post)::int as found,
            coalesce((select author_key = $2 from post), false) as own,
            coalesce((select blocked_at is not null from post), false) as blocked,
            (select ok from room) as room,
            (select yes from held) as held`,
    [code, session.accountKey, LIBRARY_LIMIT],
  )
  if (result.status !== 'ok') return reacted('favorite not added', code, result.status)

  const row = result.rows[0]
  const gate = verdict(row)
  if (gate !== 'ok') return gate
  return row.held || row.room ? 'ok' : 'limit'
}

export async function addReport(value: string, comment: string): Promise<ReactionStatus> {
  const code = codeOrNull(value)
  const session = await auth()
  if (!session?.user) return 'anonymous'
  if (!session.accountKey) return 'stale'
  if (!code) return 'error'

  const result = await query<Verdict & { room: boolean }>(
    'public:report',
    `with post as (
       select code, author_key, blocked_at, content, language
         from public_seasons where code = $1
     ),
     room as (
       select count(*) < $4 as ok from public_reports
        where reporter_key = $2 and code is distinct from $1
     ),
     added as (
       insert into public_reports (code, author_key, reporter_key, comment, content, language)
       select code, author_key, $2, $3, content, language from post
        where author_key is not null and author_key <> $2
          and blocked_at is null and (select ok from room)
       on conflict (code, reporter_key)
         do update set comment = excluded.comment, created_at = now()
       returning 1
     )
     select (select count(*) from post)::int as found,
            coalesce((select author_key is null or author_key = $2 from post), false) as own,
            coalesce((select blocked_at is not null from post), false) as blocked,
            (select ok from room) as room`,
    [code, session.accountKey, comment, LIBRARY_LIMIT],
  )
  if (result.status !== 'ok') return reacted('report not added', code, result.status)

  const row = result.rows[0]
  const gate = verdict(row)
  if (gate !== 'ok') return gate
  return row.room ? 'ok' : 'limit'
}

interface Verdict {
  found: number
  own: boolean
  blocked: boolean
}

function verdict(row: Verdict | undefined): ReactionStatus {
  if (!row?.found) return 'error'
  if (row.blocked) return 'blocked'
  return row.own ? 'own' : 'ok'
}

function reacted(message: string, code: string, reason: string): 'error' {
  logger.error(message, { code, reason })
  return 'error'
}

export interface FavoriteEntry {
  code: string
  title: string
  savedAt: Date
  palette: PaletteId
  month: string
  lang: Lang
  hidden: boolean
}

export type FavoritesState =
  { status: 'ok'; entries: FavoriteEntry[] } | { status: 'anonymous' | 'stale' | 'error' }

export async function listFavorites(
  search: string,
  sort: LibrarySort,
  lang: Lang,
): Promise<FavoritesState> {
  const session = await auth()
  if (!session?.user) return { status: 'anonymous' }
  if (!session.accountKey) return { status: 'stale' }

  const result = await query<{
    code: string
    content: unknown
    names: unknown
    palette: string
    language: string
    rolling_month: boolean
    hidden_at: Date | null
    created_at: Date
  }>(
    'public:favorites',
    `select p.code, p.content, p.names, p.palette, p.language, p.rolling_month, p.hidden_at,
            f.created_at
       from public_favorites f
       join public_seasons p on p.id = f.public_id
      where f.account_key = $1 and p.blocked_at is null
      order by f.created_at desc
      limit ${LIBRARY_LIMIT}`,
    [session.accountKey],
  )
  if (result.status !== 'ok') {
    logger.error('favorites not read', { accountKey: session.accountKey, reason: result.status })
    return { status: 'error' }
  }

  const entries = result.rows.map((row) => {
    const template = joinSeason(row.content, row.names)
    const shown = row.rolling_month ? withTargetMonth(template) : template
    return {
      code: row.code,
      title: defaultSeasonTitle(shown, knownLang(row.language)),
      savedAt: row.created_at,
      palette: knownPalette(row.palette),
      month: monthOf(shown, knownLang(row.language)),
      lang: knownLang(row.language),
      hidden: Boolean(row.hidden_at),
    }
  })

  const found = search
    ? entries.filter((entry) => entry.title.toLowerCase().includes(search.toLowerCase()))
    : entries
  if (sort === 'name') found.sort((a, b) => a.title.localeCompare(b.title, lang))
  return { status: 'ok', entries: found }
}

export interface PublishedEntry {
  code: string
  title: string
  savedAt: Date
  palette: PaletteId
  month: string
  lang: Lang
  hidden: boolean
  blocked: boolean
  likes: number
  favorites: number
  forks: number
}

export type PublishedState =
  { status: 'ok'; entries: PublishedEntry[] } | { status: 'anonymous' | 'stale' | 'error' }

export async function listPublished(
  search: string,
  sort: LibrarySort,
  lang: Lang,
): Promise<PublishedState> {
  const session = await auth()
  if (!session?.user) return { status: 'anonymous' }
  if (!session.accountKey) return { status: 'stale' }

  const result = await query<{
    code: string
    content: unknown
    names: unknown
    palette: string
    language: string
    rolling_month: boolean
    hidden_at: Date | null
    blocked_at: Date | null
    created_at: Date
    likes: number
    favorites: number
    forks: number
  }>(
    'public:mine',
    `select p.code, p.content, p.names, p.palette, p.language, p.rolling_month,
            p.hidden_at, p.blocked_at, p.created_at,
            (select count(*) from public_likes l where l.public_id = p.id)::int as likes,
            (select count(*) from public_favorites f where f.public_id = p.id)::int as favorites,
            (select count(*) from public_forks k where k.public_id = p.id)::int as forks
       from public_seasons p
      where p.author_key = $1
      order by p.created_at desc
      limit ${LIBRARY_LIMIT}`,
    [session.accountKey],
  )
  if (result.status !== 'ok') {
    logger.error('published not read', { accountKey: session.accountKey, reason: result.status })
    return { status: 'error' }
  }

  const entries = result.rows.map((row) => {
    const template = joinSeason(row.content, row.names)
    const shown = row.rolling_month ? withTargetMonth(template) : template
    return {
      code: row.code,
      title: defaultSeasonTitle(shown, knownLang(row.language)),
      savedAt: row.created_at,
      palette: knownPalette(row.palette),
      month: monthOf(shown, knownLang(row.language)),
      lang: knownLang(row.language),
      hidden: Boolean(row.hidden_at),
      blocked: Boolean(row.blocked_at),
      likes: row.likes,
      favorites: row.favorites,
      forks: row.forks,
    }
  })

  const found = search
    ? entries.filter((entry) => entry.title.toLowerCase().includes(search.toLowerCase()))
    : entries
  if (sort === 'name') found.sort((a, b) => a.title.localeCompare(b.title, lang))
  return { status: 'ok', entries: found }
}
