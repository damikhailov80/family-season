export type AccentColor = 'navy' | 'purple' | 'green' | 'orange' | 'blue' | 'pink' | 'leaf' | 'tangerine'

export type FaceVariant = 'dad' | 'mom' | 'son' | 'daughter'

export type MoodValue = 'good' | 'ok' | 'bad' | null

export interface WeekCard {
  title: string
  lines: string[]
  photoAlt: string
  /** Путь к реальному фото в /public. Если не задан — рисуется плейсхолдер. */
  photoSrc?: string
}

export interface PersonProject {
  role: string
  face: FaceVariant
  accent: AccentColor
  project: string
  description: string[]
  monthGoal: string
  percent: number
}

export interface MoodRow {
  role: string
  face: FaceVariant
  accent: AccentColor
  values: MoodValue[]
}
