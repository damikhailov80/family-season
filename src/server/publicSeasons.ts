import { auth } from './auth'
import { query } from './db'
import { logger } from './logger'
import { monthName } from '../model/calendar'
import { IDEAS_PAGE, type PublishStatus, type ReactionStatus } from '../model/community'
import { knownIconSet } from '../model/icons'
import { defaultSeasonTitle, ideaTitle, LIBRARY_LIMIT, type LibrarySort } from '../model/library'
import { knownPalette } from '../model/palettes'
import { anonymousNames, joinSeason, withTargetMonth } from '../model/season'
import { codeOrNull, shortCode } from '../model/shortcode'
import type { Template } from '../model/types'
import type { IconSetId, PaletteId } from '../types'

/**
 * Публичный сезон — выложенная идея, живущая по постоянному короткому адресу
 * `/s/<code>`. Читают его все, включая невошедших: «что тут выложено» — факт
 * публичный, и вход для просмотра не нужен.
 *
 * Повадка та же, что у остальных серверных модулей: беды `db.ts` схлопываются
 * в один статус, а разбираться в них — по строке лога.
 */

export interface PublicSeasonView {
  code: string
  template: Template
  palette: PaletteId
  iconSet: IconSetId
  /** Набор заполнения — только у системных сезонов, у людских его не бывает. */
  fillId: string | null
  /** Это выложил тот, кто сейчас смотрит: ему можно убрать сезон с витрины. */
  mine: boolean
  /** Ничей системный сезон — наш пример. На такой не жалуются. */
  system: boolean
  /** Снят с витрины: по прямой ссылке открывается, в «Идеях» его нет. */
  hidden: boolean
  /** Сколько людей лайкнуло. Считается по рядам, отдельного счётчика нет. */
  likes: number
  liked: boolean
  reported: boolean
  favorited: boolean
}

export type PublicSeasonState =
  | { status: 'ok'; season: PublicSeasonView }
  | { status: 'missing' }
  | { status: 'error' }

interface Row {
  code: string
  content: unknown
  names: unknown
  palette: string
  icon_set: string
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

/**
 * Сезон по коду из адреса. `missing` и `error` разведены намеренно: первое —
 * обычная жизнь (ссылку перепечатали, сезон удалили), и это честный 404, а
 * второе — наша беда, и показывать вместо сезона выдуманное содержимое нельзя.
 *
 * Скрытые с витрины сезоны открываются как обычные: снятие с «Идей» не отменяет
 * прямую ссылку — её уже кому-то отправили.
 */
export async function readPublicSeason(value: string): Promise<PublicSeasonState> {
  const code = codeOrNull(value)
  if (!code) return { status: 'missing' }

  const session = await auth()
  // Пустая строка вместо ключа: сравнение с ней не совпадёт ни с одним аккаунтом.
  const me = session?.accountKey ?? ''
  const result = await query<Row>(
    'public:read',
    `select p.code, p.content, p.names, p.palette, p.icon_set, p.fill_id, p.rolling_month,
            p.author_key, p.hidden_at, p.blocked_at,
            (select count(*) from public_likes l where l.public_id = p.id)::int as likes,
            exists(select 1 from public_likes l
                    where l.public_id = p.id and l.account_key = $2) as liked,
            exists(select 1 from public_reports r
                    where r.public_id = p.id and r.reporter_key = $2) as reported,
            exists(select 1 from public_favorites f
                    where f.public_id = p.id and f.account_key = $2) as favorited
       from public_seasons p where p.code = $1`,
    [code, me],
  )
  if (result.status !== 'ok') {
    logger.error('public season not read', { code, reason: result.status })
    return { status: 'error' }
  }

  const row = result.rows[0]
  if (!row) return { status: 'missing' }
  /*
   * Закрытая публикация не открывается никому, включая автора: «не показывается
   * ни по прямой ссылке, ни на витрине» — значит, нигде. В базе она при этом
   * остаётся: на неё пожаловались, и разбор не должен упираться в удалённую
   * строку. Автор узнаёт о закрытии в своём списке «Опубликованных».
   */
  if (row.blocked_at) return { status: 'missing' }

  const template = joinSeason(row.content, row.names)
  return {
    status: 'ok',
    season: {
      code: row.code,
      template: row.rolling_month ? withTargetMonth(template) : template,
      palette: knownPalette(row.palette),
      iconSet: knownIconSet(row.icon_set),
      fillId: row.fill_id,
      // Системный сезон ничей: убрать его с витрины нельзя никому.
      mine: Boolean(row.author_key) && row.author_key === session?.accountKey,
      system: !row.author_key,
      hidden: Boolean(row.hidden_at),
      likes: row.likes,
      liked: row.liked,
      reported: row.reported,
      favorited: row.favorited,
    },
  }
}

/**
 * Отметить, что этот сезон форкнули.
 *
 * Только статистика для автора: «сколько людей взяло себе». Пара «публикация +
 * аккаунт» — первичный ключ, поэтому повторный форк тем же человеком не считается
 * вторым, а форк невошедшего не считается вовсе: считаем людей, а безымянного
 * посчитать не за что. Свой же форк не считается тоже — по той же причине, по
 * которой своё не лайкают: это не чужой интерес, а работа над своим сезоном.
 *
 * Форку эта запись не нужна — он уже случился, — поэтому отказ базы здесь ничего
 * не отменяет и наружу не выходит.
 */
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

/**
 * Выложить свой сохранённый сезон на витрину.
 *
 * Публикация — **копия**, а не указатель: связь с личным сезоном обрывается
 * здесь же и навсегда. Дальше правки в кабинете витрину не трогают, а удаление
 * сезона публикацию не уносит. Потому и выкладывать можно только сохранённое:
 * копировать нечего, пока нечего указывать.
 *
 * Одинакового контента на витрине не бывает — это правило держит база
 * (`content_key` — уникальный `md5(content::text)`). В сравнение не входят ни
 * тема, ни рисунки, ни имена, ни название: сезон, у которого поменяли краски
 * или подписали другими именами, — тот же самый сезон.
 *
 * Из этого следует и перехват: если такой контент уже лежит, но **снят с
 * витрины**, публикация не заводит вторую строку, а забирает прежнюю себе —
 * с её кодом, лайками и всем, что она успела собрать. Меняется только авторство
 * и оформление. Видимую же строку никто не перехватывает: там `duplicate`.
 *
 * **Закрытую строку не перехватывает никто и никогда.** Иначе блокировка ничего
 * бы не стоила: форкнул, выложил заново — и тот же самый постер снова на витрине.
 * Закрывают не строку, а содержимое.
 */
export async function publishSeason(
  value: string,
  anonymize: boolean,
): Promise<{ status: PublishStatus; code?: string; fresh?: boolean }> {
  const code = codeOrNull(value)
  const session = await auth()
  if (!session?.user) return { status: 'anonymous' }
  if (!session.accountKey) return { status: 'stale' }
  if (!code) return { status: 'error' }

  /*
   * Имена нужны здесь, а не в самом операторе: обезличивание — дело случая, а
   * случайность в SQL городить незачем. Заодно берём id будущей строки: код —
   * перестановка его битов, и посчитать его надо до вставки.
   */
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
  // Сезона нет или он чужой — это не «мест не осталось», а испорченный запрос.
  if (!row) return { status: 'error' }

  const names = Array.isArray(row.names) ? row.names : []
  const shown = anonymize ? anonymousNames(names.length) : names
  const id = Number(row.id)

  const result = await query<{
    room: boolean
    added: string | null
    taken: string | null
    existing: string | null
    blocked: boolean | null
  }>(
    'public:publish',
    `with mine as (
       select content, palette, icon_set from user_seasons where code = $1 and account_key = $2
     ),
     key as (select md5((select content from mine)::text) as value),
     existing as (
       select code, blocked_at from public_seasons where content_key = (select value from key)
     ),
     room as (select count(*) < $6 as ok from public_seasons where author_key = $2),
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
          and (select ok from room)
       returning code
     ),
     added as (
       insert into public_seasons (id, code, author_key, content, names, palette, icon_set)
       select $3, $4, $2, m.content, $5::jsonb, m.palette, m.icon_set from mine m
        where (select ok from room) and not exists (select 1 from existing)
       returning code
     )
     select (select ok from room) as room,
            (select code from added) as added,
            (select code from taken) as taken,
            (select code from existing) as existing,
            (select blocked_at is not null from existing) as blocked`,
    [code, session.accountKey, id, shortCode('public', id), JSON.stringify(shown), LIBRARY_LIMIT],
  )
  if (result.status !== 'ok') {
    logger.error('season not published', { code, reason: result.status })
    return { status: 'error' }
  }

  const outcome = result.rows[0]
  const fresh = outcome?.added ?? outcome?.taken
  if (fresh) return { status: 'ok', code: fresh, fresh: true }
  // Закрытое не показываем даже кодом: смотреть там нечего.
  if (outcome?.blocked) return { status: 'blocked' }
  // Дубль сообщаем вместе с кодом: человеку нужен не отказ, а тот самый сезон.
  if (outcome?.existing) return { status: 'duplicate', code: outcome.existing }
  return { status: outcome?.room === false ? 'limit' : 'error' }
}

/**
 * Убрать свой сезон с витрины.
 *
 * Строка остаётся (и лишь помечается скрытой), если её держит хоть что-то из
 * двух:
 *
 *  — её **отложили в избранное**: у людей в кабинете не должно пропадать то, что
 *    они отложили, а прямая ссылка на сезон уже разошлась;
 *  — на неё **пожаловались**: жалоба обязана указывать на то, на что подана, и
 *    уносить её вместе с публикацией нельзя — как раз из-за жалобы публикацию
 *    и могут разбирать.
 *
 * Не держит ничего — удаляем совсем. Лайки и форки удалению не мешают: лайк —
 * знак внимания, форк — копия, которая и так живёт своей жизнью.
 */
export async function withdrawPublic(value: string): Promise<{ status: PublishStatus; hidden?: boolean }> {
  const code = codeOrNull(value)
  const session = await auth()
  if (!session?.user) return { status: 'anonymous' }
  if (!session.accountKey) return { status: 'stale' }
  if (!code) return { status: 'error' }

  const found = await query<{ id: string; held: boolean }>(
    'public:withdraw:find',
    `select p.id,
            exists(select 1 from public_favorites f where f.public_id = p.id)
            or exists(select 1 from public_reports r where r.public_id = p.id) as held
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
    ? await query(
        'public:hide',
        'update public_seasons set hidden_at = now() where id = $1',
        [row.id],
      )
    : await query('public:drop', 'delete from public_seasons where id = $1', [row.id])

  if (result.status !== 'ok') {
    logger.error('season not withdrawn', { code, reason: result.status })
    return { status: 'error' }
  }
  return { status: 'ok', hidden: row.held }
}

/** Строка витрины: мини-постер, его название и то, чем он оброс у людей. */
export interface Idea {
  code: string
  title: string
  palette: PaletteId
  template: Template
  likes: number
  /** Ничей системный сезон — наш пример: флажка жалобы у него нет. */
  system: boolean
}

export type IdeasState = { status: 'ok'; ideas: Idea[] } | { status: 'error' }

/**
 * Десяток случайных сезонов для витрины.
 *
 * **Взвешенная выборка без повторов** (Эфраимидис — Спиракис): ключ строки —
 * `random()^(1/вес)`, берём наибольшие. Вес — лайки плюс единица, поэтому
 * залайканный сезон попадается чаще, но гарантии ему это не даёт и свежий, ещё
 * никем не замеченный, шанс сохраняет. Сортировка по лайкам такого не умеет:
 * она навсегда заперла бы витрину на первой десятке.
 *
 * Сама витрина ничего не прячет по жалобам: закрытые сезоны отсеиваются по
 * `blocked_at`, который ставит человек, разобрав жалобы (`npm run db:reports`).
 * Автоматический порог тут стоял раньше и был плох двумя вещами сразу: сезон
 * пропадал молча, а шестеро сговорившихся убирали чужое без всякого разбора.
 * Снятые с витрины сюда не попадают тоже.
 */
export async function randomIdeas(): Promise<IdeasState> {
  const result = await query<{
    code: string
    content: unknown
    names: unknown
    palette: string
    rolling_month: boolean
    likes: number
    system: boolean
  }>(
    'public:ideas',
    `select p.code, p.content, p.names, p.palette, p.rolling_month,
            p.author_key is null as system,
            (select count(*) from public_likes l where l.public_id = p.id)::int as likes
       from public_seasons p
      where p.hidden_at is null and p.blocked_at is null
      order by power(
                 random(),
                 1.0 / (1 + (select count(*) from public_likes l where l.public_id = p.id))
               ) desc
      limit $1`,
    [IDEAS_PAGE],
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
        // Название выводится из содержимого, а не хранится колонкой: публикацию
        // не называют руками, и второй копии этой строки быть не должно.
        // Месяца с годом в нём нет: идее они цены не добавляют (см. `ideaTitle`).
        title: ideaTitle(shown),
        palette: knownPalette(row.palette),
        template: shown,
        likes: row.likes,
        system: row.system,
      }
    }),
  }
}

/**
 * Поставить или снять лайк.
 *
 * Желаемое состояние приходит от клиента, а не вычисляется здесь, и это не
 * лень: «переключить» одним запросом не выходит — удаление и вставка в одном
 * операторе не видят работы друг друга и дерутся за первичный ключ. Так запрос
 * один и **идемпотентен**: повторное нажатие в другой вкладке ничего не ломает.
 *
 * Своё не лайкают: проверка стоит на сервере, хотя кнопки у своего сезона и нет.
 * Кнопки — удобство, а не рубеж защиты. Системный сезон ничей, его лайкать можно.
 */
export async function setLike(value: string, on: boolean): Promise<ReactionStatus> {
  const code = codeOrNull(value)
  const session = await auth()
  if (!session?.user) return 'anonymous'
  if (!session.accountKey) return 'stale'
  if (!code) return 'error'

  if (!on) {
    // Снятие проверки «не своё» не требует: своего лайка там и не могло быть.
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

/**
 * Отложить публичный сезон себе или убрать из отложенного.
 *
 * Избранное — единственное, что удерживает публикацию от настоящего удаления
 * (см. `withdrawPublic`), поэтому своё сюда не кладут: автор запер бы себе
 * снятие с витрины. Своё и так лежит в кабинете.
 */
export async function setFavorite(value: string, on: boolean): Promise<ReactionStatus> {
  const code = codeOrNull(value)
  const session = await auth()
  if (!session?.user) return 'anonymous'
  if (!session.accountKey) return 'stale'
  if (!code) return 'error'

  if (!on) {
    const removed = await query(
      'public:unfavorite',
      `delete from public_favorites
        where account_key = $2
          and public_id = (select id from public_seasons where code = $1)`,
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
  // Уже лежало — это удача, а не переполнение: предел мог упереться в него самого.
  return row.held || row.room ? 'ok' : 'limit'
}

/**
 * Жалоба с комментарием.
 *
 * Повторная жалоба **уточняет прежнюю**, а не заводит вторую: человек вправе
 * дописать, что именно не так, и это не должно выглядеть отказом. Считаются
 * поэтому авторы, а не нажатия — на том и держится порог `REPORTS_TO_REVIEW`, после
 * которого публикацию смотрит человек (`npm run db:reports`).
 *
 * Автор публикации в строке — **снимок**, а не дубль: у скрытой публикации
 * авторство меняется (её перехватывает тот, кто выложил тот же контент заново),
 * а жалоба обязана помнить, на кого её подавали. Сама публикация при этом никуда
 * не денется: строку с жалобами не удаляют (см. `withdrawPublic`).
 *
 * На системный сезон пожаловаться нельзя: иначе шестеро недовольных спрятали бы
 * с витрины наши примеры.
 */
export async function addReport(value: string, comment: string): Promise<ReactionStatus> {
  const code = codeOrNull(value)
  const session = await auth()
  if (!session?.user) return 'anonymous'
  if (!session.accountKey) return 'stale'
  if (!code) return 'error'

  const result = await query<Verdict & { room: boolean }>(
    'public:report',
    `with post as (select id, author_key, blocked_at from public_seasons where code = $1),
     room as (
       select count(*) < $4 as ok from public_reports
        where reporter_key = $2 and public_id is distinct from (select id from post)
     ),
     added as (
       insert into public_reports (public_id, author_key, reporter_key, comment)
       select id, author_key, $2, $3 from post
        where author_key is not null and author_key <> $2
          and blocked_at is null and (select ok from room)
       on conflict (public_id, reporter_key)
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
  /** Своё — или ничьё системное: и то и другое трогать нечего. */
  own: boolean
  /** Закрытая публикация: с ней не делают вообще ничего. */
  blocked: boolean
}

/**
 * Общий разбор ответа «нашлась ли публикация и не своя ли она». Проверка стоит
 * на сервере, хотя кнопок у своего сезона и так нет: кнопки — удобство, а не
 * рубеж защиты.
 */
function verdict(row: Verdict | undefined): ReactionStatus {
  if (!row?.found) return 'error'
  if (row.blocked) return 'blocked'
  return row.own ? 'own' : 'ok'
}

/** Тот же приём, что везде: беда — одним статусом, подробности — в лог. */
function reacted(message: string, code: string, reason: string): 'error' {
  logger.error(message, { code, reason })
  return 'error'
}

/** Строка «Избранного» в кабинете: отложенная чужая публикация. */
export interface FavoriteEntry {
  code: string
  title: string
  savedAt: Date
  palette: PaletteId
  month: string
  /** Сезон сняли с витрины: по ссылке он открывается, в «Идеях» его нет. */
  hidden: boolean
}

export type FavoritesState =
  | { status: 'ok'; entries: FavoriteEntry[] }
  | { status: 'anonymous' | 'stale' | 'error' }

/**
 * Отложенное. Поиск и порядок считаются **здесь, а не в запросе**, и это не
 * лень: названия у публикаций нет — оно выводится из содержимого, и искать по
 * нему в SQL нечего. Строк не больше сотни, разбор дешёвый.
 *
 * Закрытых сезонов в списке нет: показывать нечего, открыть их всё равно нельзя.
 * Сама закладка при этом остаётся — вернут сезон, вернётся и она.
 */
export async function listFavorites(
  search: string,
  sort: LibrarySort,
): Promise<FavoritesState> {
  const session = await auth()
  if (!session?.user) return { status: 'anonymous' }
  if (!session.accountKey) return { status: 'stale' }

  const result = await query<{
    code: string
    content: unknown
    names: unknown
    palette: string
    rolling_month: boolean
    hidden_at: Date | null
    created_at: Date
  }>(
    'public:favorites',
    `select p.code, p.content, p.names, p.palette, p.rolling_month, p.hidden_at, f.created_at
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
      title: defaultSeasonTitle(shown),
      savedAt: row.created_at,
      palette: knownPalette(row.palette),
      month: `${monthName(shown.theme).toLowerCase()} ${shown.theme.year}`,
      hidden: Boolean(row.hidden_at),
    }
  })

  const found = search
    ? entries.filter((entry) => entry.title.toLowerCase().includes(search.toLowerCase()))
    : entries
  if (sort === 'name') found.sort((a, b) => a.title.localeCompare(b.title, 'ru'))
  return { status: 'ok', entries: found }
}

/** Строка «Опубликованных»: своя публикация и то, чем она обросла. */
export interface PublishedEntry {
  code: string
  title: string
  savedAt: Date
  palette: PaletteId
  month: string
  /** Снята с витрины: живёт по ссылке, в «Идеях» её нет. */
  hidden: boolean
  /** Закрыта после разбора жалоб: не открывается нигде. */
  blocked: boolean
  likes: number
  /** Сколько людей отложило её себе — они же держат её от удаления. */
  favorites: number
  /** Сколько людей забрало её копией. Форк — копия, и от неё уже не зависит. */
  forks: number
}

export type PublishedState =
  | { status: 'ok'; entries: PublishedEntry[] }
  | { status: 'anonymous' | 'stale' | 'error' }

/**
 * Свои публикации со счётчиками.
 *
 * Все три числа считаются **рядами**, а не хранятся колонками рядом: колонка
 * была бы второй копией и однажды разошлась бы с самими рядами. Поиск и порядок,
 * как и у избранного, считаются здесь: названия у публикации нет, оно выводится
 * из содержимого.
 */
export async function listPublished(
  search: string,
  sort: LibrarySort,
): Promise<PublishedState> {
  const session = await auth()
  if (!session?.user) return { status: 'anonymous' }
  if (!session.accountKey) return { status: 'stale' }

  const result = await query<{
    code: string
    content: unknown
    names: unknown
    palette: string
    rolling_month: boolean
    hidden_at: Date | null
    blocked_at: Date | null
    created_at: Date
    likes: number
    favorites: number
    forks: number
  }>(
    'public:mine',
    `select p.code, p.content, p.names, p.palette, p.rolling_month, p.hidden_at, p.blocked_at,
            p.created_at,
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
      title: defaultSeasonTitle(shown),
      savedAt: row.created_at,
      palette: knownPalette(row.palette),
      month: `${monthName(shown.theme).toLowerCase()} ${shown.theme.year}`,
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
  if (sort === 'name') found.sort((a, b) => a.title.localeCompare(b.title, 'ru'))
  return { status: 'ok', entries: found }
}
