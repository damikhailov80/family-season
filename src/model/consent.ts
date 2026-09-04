/**
 * Главное правило всего механизма: нет `GA_ID` — нет ничего. Ни баннера, ни
 * строки в подвале, ни раздела в кабинете, ни одного запроса к Google:
 * спрашивать согласие на то, чего не происходит, нельзя.
 */

export type Consent = 'granted' | 'denied'

/**
 * На что именно согласились. Появится вторая цель — поднимите версию, и баннер
 * выйдет ко всем ещё раз: прежний ответ ей не указ.
 */
export const CONSENT_VERSION = 1

/** Не `httpOnly`: ставит куку действие, читает лейаут — оба серверные. */
export const CONSENT_COOKIE = 'fs-consent'

/**
 * Полгода. Отказ живёт ровно столько же: переспрашивать отказавшегося чаще, чем
 * согласившегося, — тот самый нажим, которого GDPR и не велит.
 */
export const CONSENT_COOKIE_MAX_AGE = 60 * 60 * 24 * 180

export function consentOrNull(value: unknown): Consent | null {
  return value === 'granted' || value === 'denied' ? value : null
}

/**
 * Версия едет в самом значении куки — `granted.1`: без неё старый ответ пережил
 * бы появление новой цели и молча сошёл бы за согласие на неё.
 */
export function consentCookieValue(value: Consent): string {
  return `${value}.${CONSENT_VERSION}`
}

/** Чужая версия читается как «не спрашивали» — то есть баннер выйдет снова. */
export function consentFromCookie(raw: unknown): Consent | null {
  if (typeof raw !== 'string') return null
  const [value, version] = raw.split('.')
  if (Number(version) !== CONSENT_VERSION) return null
  return consentOrNull(value)
}

/** То же для записи в базе: версия лежит там отдельной колонкой. */
export function consentFromRow(value: unknown, version: unknown): Consent | null {
  return Number(version) === CONSENT_VERSION ? consentOrNull(value) : null
}

/**
 * Ссылка «Куки» в подвале открывает разговор заново, а баннер уже решил, что
 * показывать его не надо. Приём тот же, что у `announce` в `draft.ts`: ради одной
 * кнопки заводить контекст и делать подвал клиентским незачем.
 */
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
