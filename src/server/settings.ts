import { cache } from 'react'
import { auth } from './auth'
import { query } from './db'
import { logger } from './logger'
import { CONSENT_VERSION, consentFromRow, type Consent } from '../model/consent'
import { DEFAULT_FAMILY, normalizeFamily, type FamilyPreset } from '../model/family'
import { langOrNull, type Lang } from '../model/lang'

interface Row {
  family: unknown
  language: unknown
  consent: unknown
  consent_version: unknown
}

const SELECT =
  'select family, language, consent, consent_version from user_settings where account_key = $1'

const readSettings = cache(async (): Promise<Row | null> => {
  const session = await auth()
  const key = session?.accountKey
  if (!key) return null

  const result = await query<Row>('settings:read', SELECT, [key])
  if (result.status !== 'ok' || result.rows.length === 0) return null
  return result.rows[0]
})

export const readFamily = cache(async (): Promise<FamilyPreset | null> => {
  const row = await readSettings()
  return row ? normalizeFamily(row.family) : null
})

export const readLanguage = cache(async (): Promise<Lang | null> => {
  const row = await readSettings()
  return row ? langOrNull(row.language) : null
})

export const readConsentSetting = cache(async (): Promise<Consent | null> => {
  const row = await readSettings()
  return row ? consentFromRow(row.consent, row.consent_version) : null
})

export type FamilyStatus = 'anonymous' | 'stale' | 'error' | 'ok'

export type SaveFamilyStatus = Exclude<FamilyStatus, 'ok'> | 'unnamed'

export type FamilyState =
  | { status: 'anonymous' | 'stale' | 'error' }
  | { status: 'ok'; family: FamilyPreset | null; language: Lang | null; consent: Consent | null }

export async function familyState(): Promise<FamilyState> {
  const session = await auth()
  if (!session?.user) return { status: 'anonymous' }
  if (!session.accountKey) return { status: 'stale' }

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

  logger.error('family settings not saved', {
    accountKey: session.accountKey,
    reason: result.status,
  })
  return 'error'
}

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
