import type { FaceVariant } from '../types'

export interface Person {
  id: string
  name: string
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
  monthIndex: number
}

export interface Template {
  header: { title: string; ribbon: string }
  theme: MonthRef & { subtitle: string; question: string }
  weeksNote: string
  weeks: WeekCard[]
  projectsNote: string
  goal: string
  people: Person[]
}

export interface FillState {
  percents: Record<string, number>
  moods: Record<string, string>
  summaryAnswer: string
  nextIdeas: string
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
