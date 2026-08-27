import { monthName } from './calendar'
import { PLACEHOLDERS } from './labels'
import { ROUTES } from './site'
import type { Template } from './types'

/**
 * Библиотека сезонов: избранное и свои сохранённые постеры.
 *
 * В базу едет **адрес постера**, а не разобранный бланк, — ровно та строка, что
 * стоит в адресной строке браузера. Поэтому второй копии состояния не появляется:
 * формат по-прежнему знает один `codec.ts`, а сервер хранит его вывод как есть.
 *
 * Файл намеренно без серверных зависимостей: им пользуются и лист, и серверные
 * действия, и страница «Мои сезоны».
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

/** Что за список: свои сезоны или отложенное чужое. */
export type LibraryKind = 'seasons' | 'favorites'

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
 * Пустых полей на бланке не бывает: незаполненная тема печатается подсказкой,
 * ей же сезон и называется в списке.
 */
export function defaultSeasonTitle(template: Template): string {
  const name = template.theme.subtitle.trim() || PLACEHOLDERS.subtitle
  return `${monthName(template.theme)} ${template.theme.year}, ${name}`.slice(0, TITLE_LIMIT)
}

/** Название приходит из браузера: однострочное, обрезанное, без хвостовых пробелов. */
export function normalizeTitle(input: unknown, fallback = 'Сезон'): string {
  if (typeof input !== 'string') return fallback
  return input.replace(/\s+/g, ' ').trim().slice(0, TITLE_LIMIT) || fallback
}

/**
 * Адрес постера приходит из браузера, а потом уезжает в `href` на странице
 * «Мои сезоны» — значит, проверяется. Пускаем только свой адрес просмотра с
 * бланком в хэше: `javascript:` и чужой сайт так не проедут.
 */
export function safeSeasonUrl(input: unknown): string | null {
  if (typeof input !== 'string') return null
  if (input.length > 4000) return null
  return input.startsWith(`${ROUTES.sheet}#d=`) ? input : null
}

/**
 * Адрес своего сохранённого сезона: к постеру дописывается пометка `s=`, по
 * которой лист узнаёт, что правит именно эту строку (см. `readSeasonId`).
 * В самой базе пометки нет — там лежит обычный адрес постера, готовый к пересылке.
 */
export function withSeasonMark(url: string, id: string): string {
  return `${url}&s=${id}`
}

/**
 * Хэш из сохранённого адреса. Читалки `codec.ts` ждут именно хэш: скорми им
 * весь адрес — и первым ключом `URLSearchParams` станет «/sheet#d».
 */
export function hashOf(url: string): string {
  const at = url.indexOf('#')
  return at < 0 ? '' : url.slice(at)
}
