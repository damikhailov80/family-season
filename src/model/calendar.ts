import { DICTS } from '../i18n/dict'
import type { Lang } from './lang'
import type { MonthRef } from './types'

export const MONTH_SWITCH_DAY = 10

export function pickTargetMonth(now: Date = new Date()): MonthRef {
  const shift = now.getDate() < MONTH_SWITCH_DAY ? 0 : 1
  const date = new Date(now.getFullYear(), now.getMonth() + shift, 1)
  return { year: date.getFullYear(), monthIndex: date.getMonth() }
}

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

export function longestMonth(lang: Lang): string {
  return monthNames(lang).reduce((longest, name) => (name.length > longest.length ? name : longest))
}

export function shiftMonth(month: MonthRef, delta: number): MonthRef {
  const date = new Date(month.year, month.monthIndex + delta, 1)
  return { year: date.getFullYear(), monthIndex: date.getMonth() }
}

export function monthInText(name: string, lang: Lang): string {
  return DICTS[lang].poster.monthLowercaseInText ? name.toLowerCase() : name
}
