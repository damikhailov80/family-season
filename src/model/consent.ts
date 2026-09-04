export type Consent = 'granted' | 'denied'

export const CONSENT_VERSION = 1

export const CONSENT_COOKIE = 'fs-consent'

export const CONSENT_COOKIE_MAX_AGE = 60 * 60 * 24 * 180

export function consentOrNull(value: unknown): Consent | null {
  return value === 'granted' || value === 'denied' ? value : null
}

export function consentCookieValue(value: Consent): string {
  return `${value}.${CONSENT_VERSION}`
}

export function consentFromCookie(raw: unknown): Consent | null {
  if (typeof raw !== 'string') return null
  const [value, version] = raw.split('.')
  if (Number(version) !== CONSENT_VERSION) return null
  return consentOrNull(value)
}

export function consentFromRow(value: unknown, version: unknown): Consent | null {
  return Number(version) === CONSENT_VERSION ? consentOrNull(value) : null
}

const listeners = new Set<() => void>()

export function openConsent(): void {
  for (const notify of listeners) notify()
}

export function subscribeConsent(notify: () => void): () => void {
  listeners.add(notify)
  return () => {
    listeners.delete(notify)
  }
}
