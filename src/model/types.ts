import type { FaceVariant } from '../types'

/**
 * Модель листа состоит из двух независимых слоёв.
 *
 * Template — бланк: всё, что печатается на бумаге. Едет в URL целиком.
 * FillState — заполнение: то, что вписывает семья. В URL НЕ едет и на печать не идёт.
 */

export interface Person {
  /** Стабильный ключ: React-список и связь со слоем заполнения. */
  id: string
  name: string
  /** Один из четырёх рисунков; цвет человека выводится из него: var(--person-<face>). */
  face: FaceVariant
  project: string
  /** Однострочное поле, как и всё в бланке: перенос делает браузер, не автор. */
  description: string
  goal: string
}

export interface WeekCard {
  title: string
  /** Однострочное поле: переносы расставляет браузер по ширине карточки. */
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
