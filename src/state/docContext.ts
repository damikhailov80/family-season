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
  maxLength: number
}

export interface DocValue {
  template: Template
  palette: PaletteId
  iconSet: IconSetId
  lang: Lang
  fill: FillState
  mode: DocMode
  days: number
  editing: boolean
  field: (path: string) => FieldBinding
  addPerson: () => void
  removePerson: (id: string) => void
  cycleFace: (id: string) => void
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

export function usePoster(): PosterText {
  return posterText(useDoc().lang)
}
