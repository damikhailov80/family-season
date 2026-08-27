import { cache } from 'react'
import { auth } from './auth'
import { query } from './db'
import { logger } from './logger'
import { normalizeFamily, type FamilyPreset } from '../model/family'

/**
 * Настройки аккаунта. Сегодня она одна — состав семьи для новых постеров.
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
}

const SELECT = 'select family from user_settings where account_key = $1'

/**
 * `cache` из React, а не наша память: за один запрос состав спрашивают и шапка
 * (ей строить ссылку «Новый сезон»), и страница кабинета — а запрос в базу
 * должен уйти один. Между запросами кэш не живёт, и это правильно: настройку
 * могли сменить в соседней вкладке.
 */
export const readFamily = cache(async (): Promise<FamilyPreset | null> => {
  const session = await auth()
  const key = session?.accountKey
  if (!key) return null

  const result = await query<Row>('settings:read', SELECT, [key])
  if (result.status !== 'ok' || result.rows.length === 0) return null
  return normalizeFamily(result.rows[0].family)
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
  | { status: 'ok'; family: FamilyPreset | null }

/** То же чтение, но с причиной пустоты — для кабинета. */
export async function familyState(): Promise<FamilyState> {
  const session = await auth()
  if (!session?.user) return { status: 'anonymous' }
  if (!session.accountKey) return { status: 'stale' }

  // Метка своя: тем же запросом ходит `readFamily`, и в логе их надо различать —
  // одну строку никто не заметит, вторая оборачивается тостом у человека.
  const result = await query<Row>('settings:read:account', SELECT, [session.accountKey])
  if (result.status !== 'ok') return { status: 'error' }
  return { status: 'ok', family: result.rows.length ? normalizeFamily(result.rows[0].family) : null }
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
