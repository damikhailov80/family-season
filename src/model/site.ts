/**
 * Адреса и контакты сайта вокруг листа. Собраны в одном месте, чтобы почта и
 * маршруты не расползались по разметке шапки, подвала и лендинга.
 */

export const CONTACT_EMAIL = 'smart.scriptorium+familyseason.online@gmail.com'

export const ROUTES = {
  home: '/',
  sheet: '/sheet',
  /** Пустой бланк сразу в правке: флаг разбирает `readNewFlag` в codec.ts. */
  newSheet: '/sheet#new=1',
  seasons: '/seasons',
} as const
