import { cache } from 'react'
import { auth } from './auth'
import { query } from './db'
import { logger } from './logger'
import { DEFAULT_FAMILY, normalizeFamily, type FamilyPreset } from '../model/family'
import { langOrNull, type Lang } from '../model/lang'

/**
 * Настройки аккаунта: состав семьи для новых постеров и язык интерфейса.
 *
 * Ни одна страница не имеет права сломаться из-за настроек: `readFamily`
 * возвращает `null` и когда человек не вошёл, и когда база не ответила.
 *
 * Кабинету одного `null` мало — ему нужна причина, и `familyState` её даёт.
 * Отказ базы приезжает статусом `error`: страница показывает тост и **пустоту
 * на месте данных**. Умолчание вместо настоящих настроек показывать нельзя —
 * это враньё, а «Сохранить» поверх него затёр бы то, чего мы не прочитали.
 */

interface Row {
  family: unknown
  language: unknown
}

const SELECT = 'select family, language from user_settings where account_key = $1'

/**
 * Строка настроек читается **одна на запрос** и разными потребителями: шапке
 * нужен язык, кабинету — и то и другое, `createSeason` — состав. Отсюда общий
 * кэшируемый читатель, а `readFamily`/`readLanguage` — только выборка поля.
 */
const readSettings = cache(async (): Promise<Row | null> => {
  const session = await auth()
  const key = session?.accountKey
  if (!key) return null

  const result = await query<Row>('settings:read', SELECT, [key])
  if (result.status !== 'ok' || result.rows.length === 0) return null
  return result.rows[0]
})

/**
 * `cache` из React, а не наша память: за один запрос состав спрашивают и шапка
 * (ей строить ссылку «Новый сезон»), и страница кабинета — а запрос в базу
 * должен уйти один. Между запросами кэш не живёт, и это правильно: настройку
 * могли сменить в соседней вкладке.
 */
export const readFamily = cache(async (): Promise<FamilyPreset | null> => {
  const row = await readSettings()
  return row ? normalizeFamily(row.family) : null
})

/**
 * Язык из настроек — или `null`, если строки настроек нет вовсе.
 *
 * `null` здесь значит **«человек язык ещё не выбирал»**, а не «язык русский», и
 * разница важна: по `null` корневой лейаут понимает, что настройку пора завести
 * (`rememberLanguage`), и записывает тот язык, который определился по браузеру.
 * Подмени мы его умолчанием — определение никогда бы не сохранилось.
 */
export const readLanguage = cache(async (): Promise<Lang | null> => {
  const row = await readSettings()
  return row ? langOrNull(row.language) : null
})

/**
 * Почему настроек может не быть.
 *
 * `stale` — человек вошёл, но в его токене нет `accountKey`: сессия выпущена
 * до того, как ключ появился. Привязать настройки не к чему, лечится входом
 * заново (см. комментарий в `auth.ts`).
 *
 * `error` — сервер не смог. Причин у этого две (`DATABASE_URL` не задан и база
 * не ответила), но **наружу они не разводятся**: человеку от разницы никакой
 * пользы, а разбираться в ней по строке `db.ts` в логе, где лежит и код
 * Postgres, и стек. Наружу — один статус и один тост.
 */
export type FamilyStatus = 'anonymous' | 'stale' | 'error' | 'ok'

export type FamilyState =
  | { status: 'anonymous' | 'stale' | 'error' }
  | { status: 'ok'; family: FamilyPreset | null; language: Lang | null }

/** То же чтение, но с причиной пустоты — для кабинета. */
export async function familyState(): Promise<FamilyState> {
  const session = await auth()
  if (!session?.user) return { status: 'anonymous' }
  if (!session.accountKey) return { status: 'stale' }

  // Метка своя: тем же запросом ходит `readFamily`, и в логе их надо различать —
  // одну строку никто не заметит, вторая оборачивается тостом у человека.
  const result = await query<Row>('settings:read:account', SELECT, [session.accountKey])
  if (result.status !== 'ok') return { status: 'error' }
  const row = result.rows[0]
  return {
    status: 'ok',
    family: row ? normalizeFamily(row.family) : null,
    language: row ? langOrNull(row.language) : null,
  }
}

/** Записывает состав и возвращает, что из этого вышло. */
export async function writeFamily(family: FamilyPreset): Promise<FamilyStatus> {
  const session = await auth()
  if (!session?.user) return 'anonymous'
  if (!session.accountKey) return 'stale'

  const result = await query(
    'settings:write',
    `insert into user_settings (account_key, family, updated_at)
     values ($1, $2::jsonb, now())
     on conflict (account_key) do update set family = excluded.family, updated_at = now()`,
    [session.accountKey, JSON.stringify(normalizeFamily(family))],
  )
  if (result.status === 'ok') return 'ok'

  // Чей именно состав пропал, из лога `db.ts` не видно: там операция, но не
  // владелец. Ключ непрозрачный, тот же, что лежит в базе, — ни имени, ни почты.
  logger.error('family settings not saved', {
    accountKey: session.accountKey,
    reason: result.status,
  })
  return 'error'
}

/**
 * Записывает язык. Отдельным оператором, а не рядом с составом: общий upsert
 * пришлось бы звать с обоими значениями сразу, и тот, кто менял язык, затирал
 * бы состав семьи прочитанным до правки — а прочитать его мог и не успеть.
 *
 * Состав в этой вставке всё же есть: строки настроек могло не быть вовсе, а
 * колонка `family` объявлена `not null`. Кладём в неё умолчание — ровно то, что
 * и так подставляется новому сезону, пока человек не собрал свой состав.
 */
export async function writeLanguage(language: Lang): Promise<FamilyStatus> {
  const session = await auth()
  if (!session?.user) return 'anonymous'
  if (!session.accountKey) return 'stale'

  const result = await query(
    'settings:write:language',
    `insert into user_settings (account_key, family, language, updated_at)
     values ($1, $2::jsonb, $3, now())
     on conflict (account_key) do update set language = excluded.language, updated_at = now()`,
    [session.accountKey, JSON.stringify(DEFAULT_FAMILY), language],
  )
  if (result.status === 'ok') return 'ok'

  logger.error('language setting not saved', {
    accountKey: session.accountKey,
    reason: result.status,
  })
  return 'error'
}
