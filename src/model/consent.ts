/**
 * Согласие на аналитику.
 *
 * Модуль без зависимостей — его читают и сервер, и браузер, и словарь ролей
 * ему не нужен. Устроен по образцу `model/lang.ts`: имя куки, срок, разбор
 * пришедшего снаружи значения.
 *
 * Главное правило всего механизма: **нет `GA_ID` — нет ничего.**
 * Ни баннера, ни строки в подвале, ни раздела в кабинете, ни одного запроса к
 * Google. Спрашивать согласие на то, чего не происходит, нельзя: человек ответит
 * на несуществующий вопрос, а мы получим запись, которая ничего не значит.
 */

export type Consent = 'granted' | 'denied'

/**
 * На что именно согласились.
 *
 * Согласие даётся не «вообще», а на конкретный набор целей. Появится вторая
 * цель — прежний ответ перестанет что-либо значить, и спросить придётся заново:
 * поднимите версию, и баннер выйдет ко всем ещё раз. Пока цель ровно одна —
 * посещаемость, — и версия не менялась ни разу.
 */
export const CONSENT_VERSION = 1

/**
 * Ответ этого браузера. Не `httpOnly`: ставит её серверное действие, а читает
 * серверный же лейаут — в `document.cookie` мы по-прежнему не лезем нигде.
 */
export const CONSENT_COOKIE = 'fs-consent'

/**
 * Полгода — общепринятый срок, после которого согласие переспрашивают: за год
 * человек забывает, о чём его спрашивали, и «согласие» превращается в молчание.
 * Отказ живёт ровно столько же: переспрашивать отказавшегося чаще, чем
 * согласившегося, — тот самый нажим, которого GDPR и не велит.
 */
export const CONSENT_COOKIE_MAX_AGE = 60 * 60 * 24 * 180

export function consentOrNull(value: unknown): Consent | null {
  return value === 'granted' || value === 'denied' ? value : null
}

/**
 * Версия едет в самом значении куки — `granted.1`.
 *
 * Второй куки под версию заводить незачем, а без версии старый ответ пережил бы
 * появление новой цели и молча сошёл бы за согласие на неё.
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
 * Кто хочет знать, что разговор о согласии просят открыть заново.
 *
 * Нужно ровно одной ссылке — «Куки» в подвале: баннер уже решил, что показывать
 * его не надо, и узнать о нажатии ему больше неоткуда. Приём тот же, что у
 * `announce`/`subscribeDraft` в `draft.ts`, и выбран по той же причине: ради
 * одной кнопки заводить контекст и делать подвал клиентским незачем.
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
