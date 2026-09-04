import { monthInText, monthName } from './calendar'
import { posterText } from './labels'
import type { Lang } from './lang'
import type { Template } from './types'
import { DICTS } from '../i18n/dict'
import { fill } from '../i18n/fill'

/** Сколько строк каждого вида держим на аккаунт. Предел держит приложение, а не схема. */
export const LIBRARY_LIMIT = 100

/** Умолчание — месяц, год и заголовок бланка, около сорока; остальное — запас. */
export const TITLE_LIMIT = 60

/**
 * Две беды `db.ts` схлопнуты в один `error`: человеку от разницы никакой пользы,
 * а `limit` — единственная, которую он может починить сам. Тип живёт в модели, а
 * не рядом с запросами: его читает и клиентский тулбар.
 */
export type LibraryStatus = 'ok' | 'anonymous' | 'stale' | 'error' | 'limit'

export type LibrarySort = 'date' | 'name'

/**
 * «Сентябрь 2026, Месяц Человека-паука». Именно подзаголовок темы, а не
 * `header.title`: заголовок одинаков у всех сезонов. Язык — язык сезона: имя
 * пишется в колонку `title` один раз и дальше живёт своей жизнью.
 */
export function defaultSeasonTitle(template: Template, lang: Lang): string {
  const name = template.theme.subtitle.trim() || posterText(lang).placeholders.subtitle
  return `${monthName(template.theme, lang)} ${template.theme.year}, ${name}`.slice(0, TITLE_LIMIT)
}

/**
 * Название выложенной идеи — без месяца и года: месяц помогает найти строку в
 * своей коллекции, а на витрине идею берут ради того, чем занять месяц.
 */
export function ideaTitle(template: Template, lang: Lang): string {
  return (template.theme.subtitle.trim() || posterText(lang).placeholders.subtitle).slice(
    0,
    TITLE_LIMIT,
  )
}

/** `anonymous` сюда не попадает: «войдите» — не отказ, его показывает окно входа. */
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

/**
 * «27 августа 2026». Своими руками, а не `Intl`: тот дописывает «г.», и рядом с
 * месяцем постера строка начинает рябить. Язык — интерфейса, а не сезона: дата
 * часть списка.
 */
export function savedOn(date: Date, lang: Lang): string {
  const months = posterText(lang).monthsOf
  return `${date.getDate()} ${monthInText(months[date.getMonth()], lang)} ${date.getFullYear()}`
}
