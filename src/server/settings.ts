import { cache } from 'react'
import { auth } from './auth'
import { query } from './db'
import { logger } from './logger'
import { CONSENT_VERSION, consentFromRow, type Consent } from '../model/consent'
import { DEFAULT_FAMILY, normalizeFamily, type FamilyPreset } from '../model/family'
import { langOrNull, type Lang } from '../model/lang'

/**
 * Ни одна страница не имеет права сломаться из-за настроек: `readFamily`
 * возвращает `null` и когда человек не вошёл, и когда база не ответила. Кабинету
 * одного `null` мало — ему нужна причина, и `familyState` её даёт.
 */

interface Row {
  family: unknown
  language: unknown
  consent: unknown
  consent_version: unknown
}

const SELECT =
  'select family, language, consent, consent_version from user_settings where account_key = $1'

/**
 * Строка читается одна на запрос и разными потребителями: шапке нужен язык,
 * кабинету — и то и другое, `createSeason` — состав.
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
 * `cache` из React, а не наша память: между запросами он не живёт, и это
 * правильно — настройку могли сменить в соседней вкладке.
 */
export const readFamily = cache(async (): Promise<FamilyPreset | null> => {
  const row = await readSettings()
  return row ? normalizeFamily(row.family) : null
})

/**
 * `null` значит «человек язык ещё не выбирал», а не «язык русский»: по нему
 * лейаут понимает, что настройку пора завести (`rememberLanguage`). Подмени мы
 * его умолчанием — определение по браузеру никогда бы не сохранилось.
 */
export const readLanguage = cache(async (): Promise<Lang | null> => {
  const row = await readSettings()
  return row ? langOrNull(row.language) : null
})

/**
 * `null`, как и у языка, значит «не спрашивали», а не «запрещено». Записанная
 * версия старше текущей читается тем же `null`: согласие на прежний набор целей
 * новым целям не указ (см. `CONSENT_VERSION`).
 */
export const readConsentSetting = cache(async (): Promise<Consent | null> => {
  const row = await readSettings()
  return row ? consentFromRow(row.consent, row.consent_version) : null
})

/**
 * `stale` — человек вошёл, но в токене нет `accountKey`: сессия выпущена до того,
 * как ключ появился, лечится входом заново (см. `auth.ts`). `error` — сервер не
 * смог; две его причины наружу не разводятся, разбираются они по логу `db.ts`.
 */
export type FamilyStatus = 'anonymous' | 'stale' | 'error' | 'ok'

/** `unnamed` отдельно от `error`: сервер в порядке, чинит это человек. */
export type SaveFamilyStatus = Exclude<FamilyStatus, 'ok'> | 'unnamed'

export type FamilyState =
  | { status: 'anonymous' | 'stale' | 'error' }
  | { status: 'ok'; family: FamilyPreset | null; language: Lang | null; consent: Consent | null }

/** То же чтение, но с причиной пустоты — для кабинета. */
export async function familyState(): Promise<FamilyState> {
  const session = await auth()
  if (!session?.user) return { status: 'anonymous' }
  if (!session.accountKey) return { status: 'stale' }

  // Метка своя: тем же запросом ходит `readFamily`, и в логе их надо различать.
  const result = await query<Row>('settings:read:account', SELECT, [session.accountKey])
  if (result.status !== 'ok') return { status: 'error' }
  const row = result.rows[0]
  return {
    status: 'ok',
    family: row ? normalizeFamily(row.family) : null,
    language: row ? langOrNull(row.language) : null,
    consent: row ? consentFromRow(row.consent, row.consent_version) : null,
  }
}

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

  // Ключ непрозрачный, тот же, что в базе: ни имени, ни почты в логе не будет.
  logger.error('family settings not saved', {
    accountKey: session.accountKey,
    reason: result.status,
  })
  return 'error'
}

/**
 * Отдельным оператором, а не рядом с составом: общий upsert пришлось бы звать с
 * обоими значениями сразу, и меняющий язык затирал бы состав прочитанным до
 * правки. Состав в этой вставке всё же есть — строки настроек могло не быть
 * вовсе, а колонка `family` объявлена `not null`.
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

/**
 * Свой оператор — по той же причине, что у языка. Пишутся все три колонки разом:
 * ответ без версии и даты — не доказательство согласия, а просто слово, и
 * `consent_at` берётся из `now()` базы, а не с часов того, кто соглашается.
 */
export async function writeConsent(consent: Consent): Promise<FamilyStatus> {
  const session = await auth()
  if (!session?.user) return 'anonymous'
  if (!session.accountKey) return 'stale'

  const result = await query(
    'settings:write:consent',
    `insert into user_settings (account_key, family, consent, consent_version, consent_at, updated_at)
     values ($1, $2::jsonb, $3, $4, now(), now())
     on conflict (account_key) do update set
       consent = excluded.consent,
       consent_version = excluded.consent_version,
       consent_at = excluded.consent_at,
       updated_at = now()`,
    [session.accountKey, JSON.stringify(DEFAULT_FAMILY), consent, CONSENT_VERSION],
  )
  if (result.status === 'ok') return 'ok'

  logger.error('consent not saved', {
    accountKey: session.accountKey,
    reason: result.status,
  })
  return 'error'
}
