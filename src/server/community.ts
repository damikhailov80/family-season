import { auth } from './auth'
import { query } from './db'
import { logger } from './logger'
import { monthName } from '../model/calendar'
import { decodeTemplate, readHashPayload, readPaletteId } from '../model/codec'
import { IDEAS_PAGE, REPORTS_TO_HIDE, type CommunityStatus } from '../model/community'
import { hashOf, LIBRARY_LIMIT } from '../model/library'
import { DEFAULT_PALETTE } from '../model/palettes'
import type { Template } from '../model/types'
import type { PaletteId } from '../types'

/**
 * Витрина «Идеи сообщества»: публикация своего сохранённого сезона, лайки и
 * жалобы на чужие.
 *
 * Повадка ровно та же, что у `library.ts`: каждая функция сама читает сессию, а
 * две беды `db.ts` (`unconfigured` и `failed`) схлопываются наружу в один статус
 * `error`. Разница одна — свой статус `own`: на свой сезон лайк не ставят и
 * жалобу не шлют.
 *
 * Ни адреса, ни названия публикация не хранит: это указатель на строку `seasons`,
 * и то и другое берётся оттуда join'ом. Поэтому переименование сезона видно на
 * витрине сразу, а удаление уносит публикацию каскадом.
 */

/** Что тулбар знает про публикацию открытого постера. */
export interface SharedLookup {
  id: string
  /** Сколько людей его лайкнуло. Считается по рядам, отдельного счётчика нет. */
  likes: number
  liked: boolean
  reported: boolean
  /** Свой сезон: кнопок лайка и жалобы у него не будет. */
  mine: boolean
}

/**
 * Выложить свой сохранённый сезон на витрину.
 *
 * Всё одним запросом: чужой сезон не публикуется (`seasons` ищется вместе с
 * владельцем), предел в сто строк проверяется тем же оператором, что и вставка
 * (между отдельными `count` и `insert` есть окно), а повторное нажатие возвращает
 * прежнюю строку — двойной клик не должен выглядеть отказом.
 */
export async function publish(seasonId: string): Promise<{ status: CommunityStatus; id?: string }> {
  const session = await auth()
  if (!session?.user) return { status: 'anonymous' }
  if (!session.accountKey) return { status: 'stale' }

  const result = await query<{ found: boolean; id: string | null }>(
    'shared:publish',
    `with mine as (select id from seasons where id = $2 and account_key = $1),
     room as (select count(*) < $3 as ok from shared_seasons where account_key = $1),
     added as (
       insert into shared_seasons (season_id, account_key)
       select id, $1 from mine where (select ok from room)
       on conflict (season_id) do nothing
       returning id
     )
     select (select id from mine) is not null as found,
            coalesce(
              (select id from added),
              (select id from shared_seasons where season_id = (select id from mine))
            ) as id`,
    [session.accountKey, seasonId, LIBRARY_LIMIT],
  )

  if (result.status !== 'ok') return { status: failed('season not published', session.accountKey, result.status) }
  const row = result.rows[0]
  // Сезона нет или он чужой — это не «мест не осталось», а испорченный запрос.
  if (!row?.found) return { status: 'error' }
  return row.id ? { status: 'ok', id: row.id } : { status: 'limit' }
}

/** Убрать с витрины. Лайки и жалобы уезжают каскадом. Не нашлось — тоже `ok`. */
export async function unpublish(seasonId: string): Promise<CommunityStatus> {
  const session = await auth()
  if (!session?.user) return 'anonymous'
  if (!session.accountKey) return 'stale'

  const result = await query(
    'shared:unpublish',
    'delete from shared_seasons where season_id = $2 and account_key = $1',
    [session.accountKey, seasonId],
  )
  if (result.status === 'ok') return 'ok'
  return failed('season not unpublished', session.accountKey, result.status)
}

/**
 * Что витрина знает про этот адрес постера.
 *
 * **Работает и без входа**, и это обязательно: «выложен ли этот сезон» — факт
 * публичный. Иначе анониму нечего было бы показать, а нажать лайк и получить
 * предложение войти он обязан ровно так же, как в случае со звёздочкой.
 *
 * Один и тот же адрес мог выложить не один человек — берём того, кто раньше.
 */
export async function findShared(url: string): Promise<SharedLookup | null> {
  const session = await auth()
  // Пустая строка вместо ключа: сравнение с ней не совпадёт ни с одним аккаунтом.
  const me = session?.accountKey ?? ''

  const result = await query<{
    id: string
    likes: number
    liked: boolean
    reported: boolean
    mine: boolean
  }>(
    'shared:find',
    `select p.id,
            p.account_key = $2 as mine,
            (select count(*) from shared_likes l where l.shared_id = p.id)::int as likes,
            exists(select 1 from shared_likes l
                    where l.shared_id = p.id and l.account_key = $2) as liked,
            exists(select 1 from shared_reports r
                    where r.shared_id = p.id and r.account_key = $2) as reported
       from shared_seasons p
       join seasons s on s.id = p.season_id
      where s.url = $1
      order by p.created_at asc
      limit 1`,
    [url, me],
  )
  return result.status === 'ok' && result.rows.length ? result.rows[0] : null
}

/**
 * Поставить или снять лайк.
 *
 * Желаемое состояние приходит от клиента, а не вычисляется здесь, и это не
 * лень: «переключить» одним запросом не выходит — удаление и вставка в одном
 * операторе не видят работы друг друга и дерутся за первичный ключ. Так запрос
 * один и **идемпотентен**: повторное нажатие в другой вкладке ничего не ломает.
 */
export async function setLike(sharedId: string, on: boolean): Promise<CommunityStatus> {
  const session = await auth()
  if (!session?.user) return 'anonymous'
  if (!session.accountKey) return 'stale'

  if (!on) {
    // Снятие проверки «не своё» не требует: своего лайка там и не могло быть.
    const removed = await query(
      'shared:unlike',
      'delete from shared_likes where shared_id = $1 and account_key = $2',
      [sharedId, session.accountKey],
    )
    if (removed.status === 'ok') return 'ok'
    return failed('like not removed', session.accountKey, removed.status)
  }

  const result = await query<{ found: number; own: boolean | null }>(
    'shared:like',
    `with post as (select id, account_key from shared_seasons where id = $1),
     added as (
       insert into shared_likes (shared_id, account_key)
       select id, $2 from post where account_key <> $2
       on conflict do nothing
       returning 1
     )
     select (select count(*) from post)::int as found,
            (select account_key = $2 from post) as own`,
    [sharedId, session.accountKey],
  )

  if (result.status !== 'ok') return failed('like not added', session.accountKey, result.status)
  return verdict(result.rows[0])
}

/**
 * Жалоба с комментарием.
 *
 * Повторная жалоба **уточняет прежнюю**, а не заводит вторую: человек вправе
 * дописать, что именно не так, и это не должно выглядеть отказом. Считаются
 * поэтому авторы, а не нажатия — на том и держится порог в пять жалоб.
 *
 * Предел в сто жалоб на аккаунт считается по чужим публикациям: правка своей же
 * жалобы не имеет права упереться в него.
 */
export async function addReport(sharedId: string, comment: string): Promise<CommunityStatus> {
  const session = await auth()
  if (!session?.user) return 'anonymous'
  if (!session.accountKey) return 'stale'

  const result = await query<{ found: number; own: boolean | null; room: boolean }>(
    'shared:report',
    `with post as (select id, account_key from shared_seasons where id = $1),
     room as (
       select count(*) < $4 as ok from shared_reports
        where account_key = $2 and shared_id <> $1
     ),
     added as (
       insert into shared_reports (shared_id, account_key, comment)
       select id, $2, $3 from post where account_key <> $2 and (select ok from room)
       on conflict (shared_id, account_key)
         do update set comment = excluded.comment, created_at = now()
       returning 1
     )
     select (select count(*) from post)::int as found,
            (select account_key = $2 from post) as own,
            (select ok from room) as room`,
    [sharedId, session.accountKey, comment, LIBRARY_LIMIT],
  )

  if (result.status !== 'ok') return failed('report not added', session.accountKey, result.status)
  const row = result.rows[0]
  const gate = verdict(row)
  if (gate !== 'ok') return gate
  return row.room ? 'ok' : 'limit'
}

/**
 * Общий разбор ответа «нашлась ли публикация и не своя ли она». Проверка стоит
 * на сервере, хотя кнопок у своего сезона и так нет: кнопки — удобство, а не
 * рубеж защиты.
 */
function verdict(row: { found: number; own: boolean | null } | undefined): CommunityStatus {
  if (!row?.found) return 'error'
  return row.own ? 'own' : 'ok'
}

/** Тот же приём, что в `library.ts`: владелец в логе, беда — одним статусом. */
function failed(message: string, accountKey: string, reason: string): 'error' {
  logger.error(message, { accountKey, reason })
  return 'error'
}

/** Строка витрины: постер, его название и то, чем он оброс у людей. */
export interface Idea {
  /** id **публикации**, а не сезона: жалоба адресуется ей. */
  id: string
  url: string
  title: string
  likes: number
  palette: PaletteId
  /**
   * Разобранный бланк — превью рисует его. Второго источника у превью нет и
   * быть не должно: и месяц, и тема, и недели лежат в самом адресе.
   * Битый адрес — `null`, и такая карточка просто без превью, а не падение.
   */
  template: Template | null
}

export type IdeasState = { status: 'ok'; ideas: Idea[] } | { status: 'error' }

interface IdeaRow {
  id: string
  url: string
  title: string
  likes: number
}

/**
 * Десяток случайных сезонов для витрины.
 *
 * **Взвешенная выборка без повторов** (Эфраимидис — Спиракис): ключ строки —
 * `random()^(1/вес)`, берём наибольшие. Вес — лайки плюс единица, поэтому
 * залайканный сезон попадается чаще, но гарантии ему это не даёт и свежий,
 * ещё никем не замеченный, шанс сохраняет. Сортировка по лайкам такого не
 * умеет: она навсегда заперла бы витрину на первой десятке.
 *
 * Порог жалоб считает **авторов**, а не нажатия: повторная жалоба одного и того
 * же человека прежнюю заменяет (см. `addReport`), иначе спрятать чужой сезон
 * мог бы кто угодно в одиночку.
 */
export async function randomIdeas(): Promise<IdeasState> {
  const result = await query<IdeaRow>(
    'shared:ideas',
    `select p.id, s.url, s.title,
            count(distinct l.account_key)::int as likes
       from shared_seasons p
       join seasons s on s.id = p.season_id
       left join shared_likes l on l.shared_id = p.id
       left join shared_reports r on r.shared_id = p.id
      group by p.id, s.url, s.title
     having count(distinct r.account_key) < $1
      order by power(random(), 1.0 / (1 + count(distinct l.account_key))) desc
      limit $2`,
    [REPORTS_TO_HIDE, IDEAS_PAGE],
  )

  if (result.status !== 'ok') {
    logger.error('ideas not read', { reason: result.status })
    return { status: 'error' }
  }
  return { status: 'ok', ideas: await Promise.all(result.rows.map(toIdea)) }
}

/**
 * Тема и бланк выводятся из сохранённого адреса, а не хранятся колонками рядом
 * с ним, — то же правило, что в «Моих сезонах», и по той же причине: колонка
 * была бы второй копией и однажды разошлась бы с постером. Декодирование не
 * бросает и стоит дёшево, а строк на витрине десять.
 */
async function toIdea(row: IdeaRow): Promise<Idea> {
  const hash = hashOf(row.url)
  const payload = readHashPayload(hash)
  return {
    id: row.id,
    url: row.url,
    title: row.title,
    likes: row.likes,
    palette: readPaletteId(hash) ?? DEFAULT_PALETTE,
    template: payload ? await decodeTemplate(payload) : null,
  }
}

/** «Сентябрь 2026» — подпись месяца на превью. Список месяцев в проекте один. */
export function ideaMonth(template: Template): string {
  return `${monthName(template.theme)} ${template.theme.year}`
}
