import { QR_URL } from './qr.data'
import { langOrNull, type Lang } from './lang'
import type { IconSetId, PaletteId } from '../types'

export const CONTACT_EMAIL = 'smart.scriptorium+familyseason.online@gmail.com'

export const SITE_URL = QR_URL

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
  privacy: '/privacy',
} as const

export function withLang(lang: Lang, path: string): string {
  return path === ROUTES.home ? `/${lang}` : `/${lang}${path}`
}

export function stripLang(pathname: string): string {
  const [, first, ...rest] = pathname.split('/')
  return langOrNull(first) ? `/${rest.join('/')}` : pathname
}

export function modeFromPath(pathname: string): 'view' | 'edit' {
  return stripLang(pathname).replace(/\/+$/, '') === ROUTES.sheetEdit ? 'edit' : 'view'
}

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

export function sharedHref(lang: Lang, token: string): string {
  return withLang(lang, `${ROUTES.shared}/${token}`)
}

export function sheetHref(lang: Lang, mode: 'view' | 'edit' = 'view'): string {
  return withLang(lang, mode === 'edit' ? ROUTES.sheetEdit : ROUTES.sheet)
}
