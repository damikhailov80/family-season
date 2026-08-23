import type { MonthRef } from './types'

export const MONTHS_RU = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
] as const

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

export function monthName({ monthIndex }: MonthRef): string {
  return MONTHS_RU[monthIndex] ?? MONTHS_RU[0]
}

/** Сдвиг месяца стрелками в режиме правки: декабрь + 1 = январь следующего года. */
export function shiftMonth(month: MonthRef, delta: number): MonthRef {
  const date = new Date(month.year, month.monthIndex + delta, 1)
  return { year: date.getFullYear(), monthIndex: date.getMonth() }
}
