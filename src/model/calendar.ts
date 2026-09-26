import { DICTS } from '../i18n/dict'
import type { Lang } from './lang'
import type { MonthRef } from './types'

export const MONTH_SWITCH_DAY = 10

// With no pinned month this rolls to the current one (or the next, past the switch day) - the
// blank's default. A pinned month (the month page's "start a September season") keeps that
// month fixed and only picks the year: the same rolled reference decides whether "September" is
// still ahead this year or has to wait for the next one.
export function pickTargetMonth(now: Date = new Date(), monthIndex?: number): MonthRef {
  const shift = now.getDate() < MONTH_SWITCH_DAY ? 0 : 1
  const rolled = new Date(now.getFullYear(), now.getMonth() + shift, 1)
  if (monthIndex === undefined) {
    return { year: rolled.getFullYear(), monthIndex: rolled.getMonth() }
  }
  const year = monthIndex >= rolled.getMonth() ? rolled.getFullYear() : rolled.getFullYear() + 1
  return { year, monthIndex }
}

export function knownMonth(value: unknown): MonthRef | undefined {
  if (!value || typeof value !== 'object') return undefined
  const { year, monthIndex } = value as { year?: unknown; monthIndex?: unknown }
  if (typeof year !== 'number' || !Number.isFinite(year)) return undefined
  if (typeof monthIndex !== 'number' || !Number.isFinite(monthIndex)) return undefined
  if (monthIndex < 0 || monthIndex > 11) return undefined
  return {
    year: Math.round(Math.min(3000, Math.max(1970, year))),
    monthIndex: Math.round(monthIndex),
  }
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
