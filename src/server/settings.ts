import { cache } from 'react'
import { auth } from './auth'
import { hasDatabase, query } from './db'
import { normalizeFamily, type FamilyPreset } from '../model/family'

/**
 * Настройки аккаунта. Сегодня она одна — состав семьи для новых постеров.
 *
 * Ни одна страница не имеет права сломаться из-за настроек: `readFamily`
 * возвращает `null` и когда человек не вошёл, и когда база не ответила.
 * Различать эти случаи умеет `familyState` — он нужен только кабинету, чтобы
 * честно сказать «настройки сейчас недоступны» вместо «у вас ничего не выбрано».
 */

interface Row {
  family: unknown
}

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

  const rows = await query<Row>('select family from user_settings where account_key = $1', [key])
  if (!rows || rows.length === 0) return null
  return normalizeFamily(rows[0].family)
})

/**
 * Почему настроек может не быть — кабинету нужно различать причины, иначе он
 * соврёт: «не отвечает хранилище» там, где на самом деле устаревшая сессия.
 *
 * `stale` — человек вошёл, но в его токене нет `accountKey`: сессия выпущена
 * до того, как ключ появился. Привязать настройки не к чему, лечится входом
 * заново (см. комментарий в `auth.ts`).
 */
export type FamilyStatus = 'anonymous' | 'stale' | 'offline' | 'ok'

export type FamilyState =
  | { status: 'anonymous' | 'stale' | 'offline' }
  | { status: 'ok'; family: FamilyPreset | null }

/** То же чтение, но с причиной пустоты — для кабинета. */
export async function familyState(): Promise<FamilyState> {
  const session = await auth()
  if (!session?.user) return { status: 'anonymous' }
  if (!session.accountKey) return { status: 'stale' }
  if (!hasDatabase()) return { status: 'offline' }

  const rows = await query<Row>('select family from user_settings where account_key = $1', [
    session.accountKey,
  ])
  if (!rows) return { status: 'offline' }
  return { status: 'ok', family: rows.length ? normalizeFamily(rows[0].family) : null }
}

/** Записывает состав и возвращает, что из этого вышло. */
export async function writeFamily(family: FamilyPreset): Promise<FamilyStatus> {
  const session = await auth()
  if (!session?.user) return 'anonymous'
  if (!session.accountKey) return 'stale'

  const rows = await query(
    `insert into user_settings (account_key, family, updated_at)
     values ($1, $2::jsonb, now())
     on conflict (account_key) do update set family = excluded.family, updated_at = now()`,
    [session.accountKey, JSON.stringify(normalizeFamily(family))],
  )
  return rows === null ? 'offline' : 'ok'
}
