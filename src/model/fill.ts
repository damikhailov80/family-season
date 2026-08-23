import type { MoodValue } from '../types'
import { daysInMonth } from './calendar'
import type { FillState, MonthRef, Template } from './types'
import { EMPTY_FILL } from './types'

const MOOD_CODES: Record<string, MoodValue> = {
  g: 'good',
  y: 'ok',
  r: 'bad',
  '.': null,
}

/**
 * Разворачивает код настроений ('ggy...') в массив ровно на число дней месяца.
 * Лишнее обрезается, недостающее остаётся пустыми клетками — их заполняют руками.
 */
export function moodValues(code: string | undefined, days: number): MoodValue[] {
  const values = [...(code ?? '')].map((char) => MOOD_CODES[char] ?? null)
  return Array.from({ length: days }, (_, index) => values[index] ?? null)
}

export function templateDays(template: Template): number {
  return daysInMonth(template.theme as MonthRef)
}

export function percentFor(fill: FillState, personId: string): number {
  const value = fill.percents[personId]
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.min(100, Math.max(0, Math.round(value)))
    : 0
}

export function normalizeFill(input: unknown): FillState {
  const raw = (input ?? {}) as Partial<FillState>
  return {
    percents: (raw.percents ?? {}) as FillState['percents'],
    moods: (raw.moods ?? {}) as FillState['moods'],
    summaryAnswer: typeof raw.summaryAnswer === 'string' ? raw.summaryAnswer : '',
    nextIdeas: typeof raw.nextIdeas === 'string' ? raw.nextIdeas : '',
    photos: (raw.photos ?? {}) as FillState['photos'],
  }
}

export { EMPTY_FILL }
