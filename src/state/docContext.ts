import { createContext, useContext } from 'react'
import type { IconSetId, PaletteId } from '../types'
import type { FillState, Template } from '../model/types'
import type { FamilyPreset } from '../model/family'
import type { Lang } from '../model/lang'
import { posterText, type PosterText } from '../model/labels'

export type DocMode = 'view' | 'edit'

export interface FieldBinding {
  value: string
  onChange: (value: string) => void
  /** Предел длины поля — место на бумаге (`src/model/limits.ts`). */
  maxLength: number
}

/**
 * Контекст знает только про бланк. Всё, что вокруг постера — где он лежит, куда
 * сохраняется, что с ним можно сделать, — держат страницы.
 */
export interface DocValue {
  template: Template
  /** Тема и набор рисунков в бланк не входят: они хранятся рядом с ним. */
  palette: PaletteId
  iconSet: IconSetId
  /** Язык сезона, а не интерфейса: им подписан печатающийся лист. */
  lang: Lang
  fill: FillState
  mode: DocMode
  /** Считается из темы: отдельного поля в модели нет. */
  days: number
  editing: boolean
  /** Привязка текстового поля по пути в шаблоне: field('people.0.name'). */
  field: (path: string) => FieldBinding
  addPerson: () => void
  removePerson: (id: string) => void
  cycleFace: (id: string) => void
  /** Меняет только рисунок и имя: содержимое карточек остаётся на местах. */
  replacePeople: (members: FamilyPreset) => void
  stepMonth: (delta: number) => void
  setPalette: (palette: PaletteId) => void
  setIconSet: (iconSet: IconSetId) => void
}

export const DocContext = createContext<DocValue | null>(null)

export function useDoc(): DocValue {
  const value = useContext(DocContext)
  if (!value) throw new Error('useDoc вызван вне провайдера постера')
  return value
}

/**
 * Подписи листа — языком сезона. Отдельный хук, чтобы секции не путали его с
 * `useDict()`: тот отдаёт язык интерфейса и на бумагу не идёт.
 */
export function usePoster(): PosterText {
  return posterText(useDoc().lang)
}
