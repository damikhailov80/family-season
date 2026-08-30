import { auth } from './auth'
import { query } from './db'
import { logger } from './logger'
import { monthInText, monthName } from '../model/calendar'
import { IDEAS_PAGE, PUBLISH_LIMIT, type PublishStatus, type ReactionStatus } from '../model/community'
import { knownIconSet } from '../model/icons'
import { knownLang, type Lang } from '../model/lang'
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
  /**
   * Язык сезона: им подписан лист. Языком витрины не фильтруется — прямая
   * ссылка обязана открываться из любого языка, и русскую идею в польском
   * интерфейсе показываем русской, а не переписанной.
   */
  lang: Lang
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
    `select p.code, p.content, p.names, p.palette, p.icon_set, p.language, p.fill_id, p.rolling_month,
            p.author_key, p.hidden_at, p.blocked_at,
            (select count(*) from public_likes l where l.public_id = p.id)::int as likes,
            exists(select 1 from public_likes l
                    where l.public_id = p.id and l.account_key = $2) as liked,
            exists(select 1 from public_reports r
                    where r.code = p.code and r.reporter_key = $2) as reported,
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
      lang: knownLang(row.language),
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
 * Что случится, если сейчас нажать «Выложить». Спрашивает окно публикации в тот
 * миг, когда открывается.
 *
 * Не дубль проверок из `publishSeason`, а их **сухой прогон**: разговор о
 * публикации должен начинаться с ответа, а не кончаться им. Раньше человек
 * заполнял окно, жал кнопку и только тогда узнавал, что такой сезон уже выложен.
 *
 * Ответ тот же, что вернула бы публикация, с одним отличием: **своя снятая
 * строка — это `ok`**, потому что публикация её вернёт (см. `taken`), а не
 * отобьёт. Рубежом защиты проверка при этом не является — решает по-прежнему
 * `publishSeason`, и на молчание базы окно ведёт себя как раньше.
 */
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
  // Сезона нет или он чужой — это испорченный запрос, а не «мест не осталось».
  if (!row?.found) return { status: 'error' }
  if (row.blocked) return { status: 'blocked' }
  // Витрину видно — отдаём код: окно предложит посмотреть, что там уже лежит.
  if (row.existing && !row.off) return { status: 'duplicate', code: row.existing }
  // Чужая снятая: выложить нельзя, а вести туда некуда — её нет на витрине.
  if (row.existing && !row.own) return { status: 'duplicate' }
  if (row.room === false) return { status: 'limit' }
  return { status: 'ok' }
}

/**
 * Выложить свой сохранённый сезон на витрину.
 *
 * Больше `PUBLISH_LIMIT` сезонов на витрине у одного человека не бывает: витрина
 * общая, и десяток случайных идей на ней не должен оказываться идеями одного
 * автора. Считаются только видимые строки — снятое и закрытое места не занимают.
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
 * Из этого следует и перехват: если **своя же** строка с таким контентом лежит
 * снятой с витрины, публикация не заводит вторую, а возвращает прежнюю — с её
 * кодом, лайками и всем, что она успела собрать. Меняется только оформление.
 *
 * **Чужую строку не перехватывает никто**, ни видимую, ни снятую: содержимое,
 * которое человек выложил, остаётся его — форк даёт копию бланка, а не право
 * распоряжаться чужой публикацией. Вернуть снятое на витрину может только автор,
 * и для этого есть своя кнопка (`republishPublic`), а не окольный путь через
 * повторную публикацию.
 *
 * **Закрытую строку не перехватывает никто и никогда.** Иначе блокировка ничего
 * бы не стоила: форкнул, выложил заново — и тот же самый постер снова на витрине.
 * Закрывают не строку, а содержимое.
 */
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
  const shown = anonymize ? anonymousNames(names.length, lang) : names
  const id = Number(row.id)

  const result = await query<{
    room: boolean
    added: string | null
    taken: string | null
    existing: string | null
    blocked: boolean | null
    /** Дубль лежит снятым с витрины: не «уже есть», а «есть, но не видно». */
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
  // Закрытое не показываем даже кодом: смотреть там нечего.
  if (outcome?.blocked) return { status: 'blocked' }
  /*
   * Дубль на витрине сообщаем **вместе с кодом**: человеку нужен не отказ, а тот
   * самый сезон, который там уже лежит. Со снятым иначе — вести на страницу,
   * которой на витрине нет, незачем, и код мы не отдаём: там остаётся тост.
   *
   * Порядок веток важен. Видимый дубль сильнее нехватки мест: освободи человек
   * хоть все пять, выложить это он всё равно не сможет. А вот снятый дубль
   * слабее: снятая строка бывает и своя, и тогда настоящая причина отказа —
   * именно места, которых не хватило её вернуть.
   */
  if (outcome?.existing && !outcome.off) return { status: 'duplicate', code: outcome.existing }
  if (outcome?.room === false) return { status: 'limit' }
  return { status: outcome?.existing ? 'duplicate' : 'error' }
}

/**
 * Убрать свой сезон с витрины.
 *
 * Строка остаётся (и лишь помечается скрытой), если её **отложили в избранное**:
 * у людей в кабинете не должно пропадать то, что они отложили, а прямая ссылка
 * на сезон уже разошлась. Не держит ничего — удаляем совсем.
 *
 * Жалоба строку больше не держит: у неё свой снимок — код и копия контента
 * (`004_reports_snapshot.sql`), и разбор не упирается в живую строку. Лайки и
 * форки не держали её никогда: лайк — знак внимания, форк — копия, которая и так
 * живёт своей жизнью.
 *
 * Снятое — не удалённое: сезон открывается по ссылке, принимает лайки и форки, а
 * автор возвращает его на витрину `republishPublic`.
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

/**
 * Вернуть свой снятый сезон на витрину.
 *
 * Пара к `withdrawPublic`, и обе кнопки — один и тот же мегафон: на самом сезоне
 * и строкой в кабинете. Своя функция, а не повторная публикация, потому что
 * возвращают **ту же строку** — с её кодом, лайками и избранным; заводить рядом
 * копию было бы и неправдой, и вторым адресом на то же самое.
 *
 * Предел тот же, что у публикации: возврат занимает место на витрине, значит,
 * считается вместе с остальными видимыми.
 *
 * Строка уже на витрине — это `ok`, а не отказ: тот же приём, что у `setLike`.
 * Желаемое состояние приходит от клиента, и повторное нажатие в соседней вкладке
 * ничего ломать не должно.
 */
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
  // Чужой и выдуманный код неразличимы: строка ищется вместе с автором.
  if (!row?.found) return 'error'
  if (row.back || row.shown) return 'ok'
  if (row.blocked) return 'blocked'
  return row.room === false ? 'limit' : 'error'
}

/**
 * «сентябрь 2026» — месяц строки списка, языком **сезона**: месяц часть самого
 * сезона, и в чужом языке он не переименовывается.
 */
function monthOf(template: Template, lang: Lang): string {
  return `${monthInText(monthName(template.theme, lang), lang)} ${template.theme.year}`
}

/** Строка витрины: мини-постер, его название и то, чем он оброс у людей. */
export interface Idea {
  code: string
  title: string
  palette: PaletteId
  template: Template
  /** Язык сезона: им подписаны подсказки пустых полей на мини-постере. */
  lang: Lang
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
 *
 * Язык — условие выборки, а не украшение: идею берут, чтобы её прочитать, и
 * витрина, полная непонятных постеров, бесполезна. Прямая ссылка при этом
 * работает из любого языка (`readPublicSeason` языком не фильтрует): пришедшему
 * по ссылке сезон уже показали, и прятать его поздно.
 */
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
        // Название выводится из содержимого, а не хранится колонкой: публикацию
        // не называют руками, и второй копии этой строки быть не должно.
        // Месяца с годом в нём нет: идее они цены не добавляют (см. `ideaTitle`).
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
 *
 * Отсюда же и уборка: **убравший закладку последним уносит скрытую строку
 * совсем**. Снятый с витрины сезон живёт ровно потому, что его кто-то отложил, —
 * не осталось никого, и держать его больше некому и незачем. Видимого это не
 * касается: он на витрине, и закладки к тому отношения не имеют.
 */
export async function setFavorite(value: string, on: boolean): Promise<ReactionStatus> {
  const code = codeOrNull(value)
  const session = await auth()
  if (!session?.user) return 'anonymous'
  if (!session.accountKey) return 'stale'
  if (!code) return 'error'

  if (!on) {
    /*
     * Один оператор, и это важно: между отдельными «убрать закладку» и «а не
     * осталось ли строке держателей» есть окно, в которое влезет чужая закладка.
     *
     * Все ветки видят **один снимок**, поэтому «моей закладки больше нет» из
     * `gone` в условии удаления не видно — и не должно быть. Пишем то, что в этом
     * снимке правда: моя закладка есть (`mine`), а чужих нет вовсе. Изменяющая
     * ветка `gone` выполняется в любом случае, даже если её никто не читает.
     *
     * Закрытую строку не удаляем никогда: на ней держится запрет выкладывать тот
     * же контент заново. Лайки, форки и закладки уходят каскадом.
     */
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
 * Жалоба живёт **дольше публикации**: сезон, снятый с витрины, исчезает, как
 * только его убирает из избранного последний, кто отложил, — а разобрать жалобу
 * надо и после этого. Поэтому в строке лежит снимок: код из адреса, автор и
 * копия контента. Разбирают ведь текст, а взять его больше неоткуда.
 *
 * Копию контента повторная жалоба не переписывает: у публикации контент не
 * правится никогда. Меняется только комментарий — человек вправе дописать, что
 * именно не так.
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
  /** Язык сезона: им названы и месяц, и сам сезон в строке списка. */
  lang: Lang
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

/** Строка «Опубликованных»: своя публикация и то, чем она обросла. */
export interface PublishedEntry {
  code: string
  title: string
  savedAt: Date
  palette: PaletteId
  month: string
  /** Язык публикации: он выбран при выкладывании и больше не меняется. */
  lang: Lang
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
