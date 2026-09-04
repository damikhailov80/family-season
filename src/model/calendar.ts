import { DICTS } from '../i18n/dict'
import type { Lang } from './lang'
import type { MonthRef } from './types'

/**
 * Имя месяца берётся словарём языка сезона, а не интерфейса: оно печатается на
 * самом листе. Отдельного поля «дней в месяце» нет и быть не должно.
 */

/** До этого числа планируем текущий месяц, начиная с него — уже следующий. */
export const MONTH_SWITCH_DAY = 10

/** Лист печатают заранее, под ещё не начавшийся месяц. */
export function pickTargetMonth(now: Date = new Date()): MonthRef {
  const shift = now.getDate() < MONTH_SWITCH_DAY ? 0 : 1
  const date = new Date(now.getFullYear(), now.getMonth() + shift, 1)
  return { year: date.getFullYear(), monthIndex: date.getMonth() }
}

/** Нулевой день следующего месяца — это последний день текущего. */
export function daysInMonth({ year, monthIndex }: MonthRef): number {
  return new Date(year, monthIndex + 1, 0).getDate()
}

export function monthNames(lang: Lang): string[] {
  return DICTS[lang].poster.months
}

export function monthName({ monthIndex }: MonthRef, lang: Lang): string {
  const months = monthNames(lang)
  return months[monthIndex] ?? months[0]
}

/** Распорка ширины заголовка: без неё стрелки прыгают при смене месяца. */
export function longestMonth(lang: Lang): string {
  return monthNames(lang).reduce((longest, name) => (name.length > longest.length ? name : longest))
}

export function shiftMonth(month: MonthRef, delta: number): MonthRef {
  const date = new Date(month.year, month.monthIndex + delta, 1)
  return { year: date.getFullYear(), monthIndex: date.getMonth() }
}

/**
 * «сентябрь 2026» в списке, «августа» в дате: у русского и польского месяц внутри
 * строки со строчной, у английского — нет. Отвечает флаг словаря, а не третий
 * список названий.
 */
export function monthInText(name: string, lang: Lang): string {
  return DICTS[lang].poster.monthLowercaseInText ? name.toLowerCase() : name
}
