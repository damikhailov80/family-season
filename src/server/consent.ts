import { cookies } from 'next/headers'
import { readConsentSetting } from './settings'
import { CONSENT_COOKIE, consentFromCookie, type Consent } from '../model/consent'

export async function readConsent(): Promise<Consent | null> {
  const jar = await cookies()
  const fromCookie = consentFromCookie(jar.get(CONSENT_COOKIE)?.value)
  if (fromCookie) return fromCookie

  return readConsentSetting()
}

export function analyticsId(): string | null {
  return process.env.GA_ID || null
}
