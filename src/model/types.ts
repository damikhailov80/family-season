import type { FaceVariant } from '../types'

/**
 * Два независимых слоя: `Template` — бланк, всё, что печатается; `FillState` —
 * заполнение, которое вписывает семья, и на печать оно не идёт.
 */

export interface Person {
  /** Стабильный ключ: React-список и связь со слоем заполнения. */
  id: string
  name: string
  /** Один из четырёх рисунков; цвет человека выводится из него: var(--person-<face>). */
  face: FaceVariant
  project: string
  description: string
  goal: string
}

export interface WeekCard {
  title: string
  text: string
}

export interface MonthRef {
  year: number
  /** 0–11, как в Date. */
  monthIndex: number
}

export interface Template {
  header: { title: string; ribbon: string }
  /** question — вопрос блока «Итоги месяца», ответ на него живёт в FillState. */
  theme: MonthRef & { subtitle: string; question: string }
  weeksNote: string
  weeks: WeekCard[]
  projectsNote: string
  goal: string
  people: Person[]
}

export interface FillState {
  /** personId -> 0..100 */
  percents: Record<string, number>
  /** personId -> код настроений ('g' | 'y' | 'r' | '.') по дню на символ */
  moods: Record<string, string>
  /** Итоги месяца — список строк через '\n'. */
  summaryAnswer: string
  /** Идеи на следующий месяц — тоже список строк через '\n'. */
  nextIdeas: string
  /** индекс недели -> путь к картинке */
  photos: Record<string, string>
}

export const WEEKS_COUNT = 4
export const MIN_PEOPLE = 2
export const MAX_PEOPLE = 5

export const EMPTY_FILL: FillState = {
  percents: {},
  moods: {},
  summaryAnswer: '',
  nextIdeas: '',
  photos: {},
}
