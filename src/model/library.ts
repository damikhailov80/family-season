import { monthInText, monthName } from './calendar'
import { posterText } from './labels'
import type { Lang } from './lang'
import type { Template } from './types'
import { DICTS } from '../i18n/dict'
import { fill } from '../i18n/fill'

export const LIBRARY_LIMIT = 100

export const TITLE_LIMIT = 60

export type LibraryStatus = 'ok' | 'anonymous' | 'stale' | 'error' | 'limit'

export type LibrarySort = 'date' | 'name'

export function defaultSeasonTitle(template: Template, lang: Lang): string {
  const name = template.theme.subtitle.trim() || posterText(lang).placeholders.subtitle
  return `${monthName(template.theme, lang)} ${template.theme.year}, ${name}`.slice(0, TITLE_LIMIT)
}

export function ideaTitle(template: Template, lang: Lang): string {
  return (template.theme.subtitle.trim() || posterText(lang).placeholders.subtitle).slice(
    0,
    TITLE_LIMIT,
  )
}

export function libraryText(
  lang: Lang,
  status: Exclude<LibraryStatus, 'ok' | 'anonymous'>,
): string {
  const text = DICTS[lang].status.library[status]
  return status === 'limit' ? fill(text, { n: LIBRARY_LIMIT }) : text
}

export function normalizeTitle(input: unknown, fallback: string): string {
  if (typeof input !== 'string') return fallback
  return input.replace(/\s+/g, ' ').trim().slice(0, TITLE_LIMIT) || fallback
}

export function savedOn(date: Date, lang: Lang): string {
  const months = posterText(lang).monthsOf
  return `${date.getDate()} ${monthInText(months[date.getMonth()], lang)} ${date.getFullYear()}`
}
