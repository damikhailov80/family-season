export const LANGS = ['ru', 'en', 'pl'] as const

export type Lang = (typeof LANGS)[number]

export const DEFAULT_LANG: Lang = 'ru'

export const LANG_LABELS: Record<Lang, string> = {
  ru: 'Русский',
  en: 'English',
  pl: 'Polski',
}

export function langOrNull(value: unknown): Lang | null {
  return LANGS.includes(value as Lang) ? (value as Lang) : null
}

export function knownLang(value: unknown): Lang {
  return langOrNull(value) ?? DEFAULT_LANG
}

export function langFromAccept(header: string | null | undefined): Lang | null {
  if (!header) return null

  const wanted = header
    .split(',')
    .map((part) => {
      const [tag, ...params] = part.trim().split(';')
      const q = params.map((p) => p.trim()).find((p) => p.startsWith('q='))
      const weight = q ? Number.parseFloat(q.slice(2)) : 1
      return {
        tag: tag.trim().toLowerCase().split('-')[0],
        weight: Number.isFinite(weight) ? weight : 0,
      }
    })
    .sort((a, b) => b.weight - a.weight)

  for (const { tag, weight } of wanted) {
    if (weight <= 0) continue
    const lang = langOrNull(tag)
    if (lang) return lang
  }
  return null
}

export const LANG_COOKIE = 'fs-lang'

export const LANG_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

export type LangSource = 'url' | 'auto'

export const LANG_SOURCE_HEADER = 'x-lang-source'

export const LANG_AUTO_COOKIE = 'fs-lang-auto'

export const LANG_PATH_HEADER = 'x-lang-path'
