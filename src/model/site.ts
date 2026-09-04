import { QR_URL } from './qr.data'
import { langOrNull, type Lang } from './lang'
import type { IconSetId, PaletteId } from '../types'

export const CONTACT_EMAIL = 'smart.scriptorium+familyseason.online@gmail.com'

/**
 * Значение приходит из `tools/qr/source.json` через собранный `qr.data.ts`, а не
 * объявлено здесь: QR собран ровно из этой строки, и вторая копия адреса рано
 * или поздно разошлась бы с ней — код молча повёл бы не туда.
 */
export const SITE_URL = QR_URL

/** Пути без языка: язык приписывает `withLang`, трёх копий каждого адреса не надо. */
export const ROUTES = {
  home: '/',
  sheet: '/sheet',
  sheetEdit: '/sheet/edit',
  seasons: '/seasons',
  ideas: '/ideas',
  publicSeason: '/s',
  season: '/season',
  shared: '/p',
  account: '/account',
  /** Политика приватности: её адрес требует Google для публикации входа. */
  privacy: '/privacy',
} as const

/**
 * Язык стоит в адресе всегда, включая русский: так `[lang]` остаётся корневым
 * параметром, иначе `next/root-params` не работает вовсе.
 */
export function withLang(lang: Lang, path: string): string {
  return path === ROUTES.home ? `/${lang}` : `/${lang}${path}`
}

/**
 * `/pl/sheet/edit` → `/sheet/edit`. Языка в пути нет — возвращаем как есть: так
 * функция годится и для адреса, который до `proxy` ещё не дошёл.
 */
export function stripLang(pathname: string): string {
  const [, first, ...rest] = pathname.split('/')
  return langOrNull(first) ? `/${rest.join('/')}` : pathname
}

/**
 * Путь берут у роутера (`usePathname`), а не из `location`: при мягком переходе
 * адрес в `location` меняется уже после рендера, и режим отдавался бы прежний.
 */
export function modeFromPath(pathname: string): 'view' | 'edit' {
  // Хвостовой слэш Next убирает редиректом, но сравнение путей не должно от этого зависеть.
  return stripLang(pathname).replace(/\/+$/, '') === ROUTES.sheetEdit ? 'edit' : 'view'
}

/**
 * Оформление дописывается перебивкой `?p=<тема>&i=<набор рисунков>`: примерившему
 * чужой сезон в своей теме надо уметь послать ссылку на то, что он видит.
 *
 * В query, а не в хэше: хэш до сервера не доходит, и присланная ссылка открылась
 * бы сперва в теме из базы, а потом перекрасилась.
 */
export function publicSeasonHref(
  lang: Lang,
  code: string,
  decor?: { palette: PaletteId; iconSet: IconSetId },
): string {
  const address = withLang(lang, `${ROUTES.publicSeason}/${code}`)
  return decor ? `${address}?p=${decor.palette}&i=${decor.iconSet}` : address
}

export function seasonHref(lang: Lang, code: string, mode: 'view' | 'edit' = 'view'): string {
  const address = `${ROUTES.season}/${code}${mode === 'edit' ? '/edit' : ''}`
  return withLang(lang, address)
}

/** Токен случайный, а не выведенный из id: его отзывают и выдают заново. */
export function sharedHref(lang: Lang, token: string): string {
  return withLang(lang, `${ROUTES.shared}/${token}`)
}

export function sheetHref(lang: Lang, mode: 'view' | 'edit' = 'view'): string {
  return withLang(lang, mode === 'edit' ? ROUTES.sheetEdit : ROUTES.sheet)
}
