import { DICTS } from '../i18n/dict'
import type { Lang } from './lang'
import type { MonthRef } from './types'

/**
 * Месяц хранится числами (`year`, `monthIndex`), имя берётся из словаря языка
 * **сезона**, а не интерфейса: название месяца печатается на самом листе.
 * Отдельного поля «дней в месяце» нет и быть не должно — их считает `daysInMonth`.
 */

/** До этого числа планируем текущий месяц, начиная с него — уже следующий. */
export const MONTH_SWITCH_DAY = 10

/**
 * Месяц, который подставляется в новый лист: до 10-го числа — текущий,
 * с 10-го — следующий (лист печатают заранее, под ещё не начавшийся месяц).
 */
export function pickTargetMonth(now: Date = new Date()): MonthRef {
  const shift = now.getDate() < MONTH_SWITCH_DAY ? 0 : 1
  const date = new Date(now.getFullYear(), now.getMonth() + shift, 1)
  return { year: date.getFullYear(), monthIndex: date.getMonth() }
}

/** Число дней в месяце — нулевой день следующего месяца это последний день текущего. */
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

/**
 * Самое длинное название — им подпирают ширину заголовка, чтобы стрелки не
 * прыгали при переключении месяца. У каждого языка оно своё: «Сентябрь»,
 * `September`, `Październik`.
 */
export function longestMonth(lang: Lang): string {
  return monthNames(lang).reduce((longest, name) => (name.length > longest.length ? name : longest))
}

/** Сдвиг месяца стрелками в режиме правки: декабрь + 1 = январь следующего года. */
export function shiftMonth(month: MonthRef, delta: number): MonthRef {
  const date = new Date(month.year, month.monthIndex + delta, 1)
  return { year: date.getFullYear(), monthIndex: date.getMonth() }
}

/**
 * Название месяца внутри строки: «сентябрь 2026» в списке сезонов, «августа» в
 * дате. У русского и польского месяц там со строчной, у английского — с
 * заглавной; за это отвечает флаг словаря, а не третий список названий.
 */
export function monthInText(name: string, lang: Lang): string {
  return DICTS[lang].poster.monthLowercaseInText ? name.toLowerCase() : name
}
