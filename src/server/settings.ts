import { cache } from 'react'
import { auth } from './auth'
import { query, type QueryResult } from './db'
import { normalizeFamily, type FamilyPreset } from '../model/family'

/**
 * Настройки аккаунта. Сегодня она одна — состав семьи для новых постеров.
 *
 * Здесь два разных отношения к мёртвой базе, и путать их нельзя.
 *
 * `readFamily` — **мягкий**: возвращает `null` и когда человек не вошёл, и когда
 * база не ответила. Его зовут шапка и `/api/family`, то есть весь сайт; уронить
 * его значит уронить лендинг и постер, которым база не нужна вовсе.
 *
 * `familyState` и `writeFamily` — **жёсткие**: обслуживают только кабинет и при
 * недоступной базе **бросают**. Кабинет без хранилища не кабинет: показывать там
 * умолчание вместо настоящих настроек — значит врать, а «попробуйте попозже» на
 * месте настоящей аварии прячет её и от человека, и от нас.
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
 * Разворачивает ответ базы или бросает. Отказ хранилища — это авария, а не
 * состояние настроек: у неё нет пометки в этом союзе, она уходит исключением.
 *
 * Причина уже в логе `db.ts` вместе с кодом Postgres и стеком, поэтому здесь
 * достаточно короткого текста: он попадёт в лог Next рядом с `digest`, по
 * которому строку и находят из страницы ошибки.
 */
function rowsOrThrow<Row>(result: QueryResult<Row>): Row[] {
  if (result.status === 'ok') return result.rows
  throw new Error(
    result.status === 'unconfigured'
      ? 'Хранилище настроек не подключено: DATABASE_URL не задан'
      : 'Хранилище настроек не ответило',
  )
}

/**
 * Почему настроек может не быть. Обе причины — про **сессию**, а не про базу:
 * недоступная база сюда не доходит, она бросает.
 *
 * `stale` — человек вошёл, но в его токене нет `accountKey`: сессия выпущена
 * до того, как ключ появился. Привязать настройки не к чему, лечится входом
 * заново (см. комментарий в `auth.ts`).
 */
export type FamilyStatus = 'anonymous' | 'stale' | 'ok'

export type FamilyState =
  | { status: 'anonymous' | 'stale' }
  | { status: 'ok'; family: FamilyPreset | null }

/** То же чтение, но для кабинета: с причиной пустоты и **с падением** при аварии. */
export async function familyState(): Promise<FamilyState> {
  const session = await auth()
  if (!session?.user) return { status: 'anonymous' }
  if (!session.accountKey) return { status: 'stale' }

  // Метка своя: `readFamily` тем же запросом ходит мягко, и в логе их надо
  // различать — одна строка ничего не роняет, вторая уводит на страницу ошибки.
  const rows = rowsOrThrow(await query<Row>('settings:read:account', SELECT, [session.accountKey]))
  return { status: 'ok', family: rows.length ? normalizeFamily(rows[0].family) : null }
}

/**
 * Записывает состав. Возвращает только то, что решается сессией; отказ базы —
 * исключение: молча потерянное сохранение хуже страницы ошибки.
 */
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
  if (result.status !== 'ok') {
    // Чьё сохранение пропало, из строки `db.ts` не видно — а без этого не
    // отличить «не повезло одному» от «база не отвечает никому». Ключ
    // непрозрачный, тот же, что лежит в базе: ни имени, ни почты в лог не идёт.
    console.error(`[settings] состав не сохранён (${session.accountKey}): ${result.status}`)
  }
  rowsOrThrow(result)
  return 'ok'
}
