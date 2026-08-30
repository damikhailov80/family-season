import { monthInText, monthName } from './calendar'
import { posterText } from './labels'
import type { Lang } from './lang'
import type { Template } from './types'
import { DICTS } from '../i18n/dict'
import { fill } from '../i18n/fill'

/**
 * Общее для всех сезонов: пределы, название, статусы.
 *
 * Файл намеренно без серверных зависимостей: им пользуются и постер, и серверные
 * действия, и страница «Мои сезоны». Слова живут в словаре — здесь только числа,
 * типы и то, что из них считается.
 */

/** Сколько строк каждого вида держим на аккаунт. Предел держит приложение, а не схема. */
export const LIBRARY_LIMIT = 100

/**
 * Предел названия. Умолчание — месяц, год и заголовок бланка (тот сам не длиннее
 * 20 символов), то есть около сорока; остальное — запас на своё имя.
 */
export const TITLE_LIMIT = 60

/**
 * Чем кончилось действие над библиотекой. Две беды `db.ts` (`unconfigured` и
 * `failed`) схлопнуты в один `error`: человеку от разницы никакой пользы.
 * `limit` — единственная беда, которую он может починить сам.
 *
 * Тип живёт в модели, а не рядом с запросами: его читает и клиентский тулбар,
 * которому серверный модуль импортировать нечем.
 */
export type LibraryStatus = 'ok' | 'anonymous' | 'stale' | 'error' | 'limit'

/** Порядок в списке. По умолчанию дата: свежее сверху. */
export type LibrarySort = 'date' | 'name'

/**
 * «Сентябрь 2026, Месяц Человека-паука» — месяц бланка и строка под названием
 * месяца.
 *
 * Именно подзаголовок темы, а не `header.title`: заголовок — это название самого
 * постера («Семейный сезон»), одинаковое у всех, а сезоны друг от друга
 * отличает как раз тема месяца.
 *
 * Язык здесь — язык **сезона**: название пишется в колонку `title` один раз, при
 * заведении, и потом живёт своей жизнью. Смена языка в кабинете его не трогает,
 * ровно как не трогает и сам бланк.
 */
export function defaultSeasonTitle(template: Template, lang: Lang): string {
  const name = template.theme.subtitle.trim() || posterText(lang).placeholders.subtitle
  return `${monthName(template.theme, lang)} ${template.theme.year}, ${name}`.slice(0, TITLE_LIMIT)
}

/**
 * «Месяц Человека-паука» — название выложенной идеи, без месяца и года.
 *
 * Месяц в названии полезен своей коллекции: там сезоны идут подряд, и месяц
 * помогает найти нужный. На витрине он не значит ничего — идею берут ради того,
 * чем занять месяц, а какой месяц был у автора, к делу не относится.
 */
export function ideaTitle(template: Template, lang: Lang): string {
  return (template.theme.subtitle.trim() || posterText(lang).placeholders.subtitle).slice(
    0,
    TITLE_LIMIT,
  )
}

/**
 * Слова, которыми сезоны объясняют отказ. `anonymous` сюда не попадает:
 * «войдите» — не отказ, а предложение, и показывает его окно входа.
 */
export function libraryText(lang: Lang, status: Exclude<LibraryStatus, 'ok' | 'anonymous'>): string {
  const text = DICTS[lang].status.library[status]
  return status === 'limit' ? fill(text, { n: LIBRARY_LIMIT }) : text
}

/** Название приходит из браузера: однострочное, обрезанное, без хвостовых пробелов. */
export function normalizeTitle(input: unknown, fallback: string): string {
  if (typeof input !== 'string') return fallback
  return input.replace(/\s+/g, ' ').trim().slice(0, TITLE_LIMIT) || fallback
}

/**
 * «27 августа 2026». Своими руками, а не `Intl`: тот дописывает «г.», и рядом с
 * месяцем самого постера строка начинает рябить. Названия месяцев в проекте и
 * так есть — второму списку взяться неоткуда.
 *
 * Падеж свой у каждого языка: русскому и польскому нужен родительный
 * (`poster.monthsOf`), английскому — тот же именительный, и это не небрежность.
 *
 * Дата — часть списка, то есть интерфейса, и язык у неё соответственно язык
 * интерфейса, а не сезона.
 */
export function savedOn(date: Date, lang: Lang): string {
  const months = posterText(lang).monthsOf
  return `${date.getDate()} ${monthInText(months[date.getMonth()], lang)} ${date.getFullYear()}`
}
