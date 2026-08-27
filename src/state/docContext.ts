import { createContext, useContext } from 'react'
import type { IconSetId, PaletteId } from '../types'
import type { FillState, Template } from '../model/types'
import type { FamilyPreset } from '../model/family'

export type DocMode = 'view' | 'edit'

/** demo — пример главной страницы, custom — свой лист (форк или пустой). */
export type DocSource = 'demo' | 'custom'

export interface FieldBinding {
  value: string
  onChange: (value: string) => void
  /** Предел длины поля — место на бумаге (`src/model/limits.ts`). */
  maxLength: number
}

export interface DocValue {
  template: Template
  /** Тема оформления. В бланк не входит: её несёт пометка `p=` в адресе. */
  palette: PaletteId
  /** Набор рисунков. Тоже не бланк: его несёт пометка `i=` в адресе. */
  iconSet: IconSetId
  fill: FillState
  mode: DocMode
  source: DocSource
  /** Число дней месяца — считается из темы, отдельного поля в модели нет. */
  days: number
  editing: boolean
  /**
   * Адреса навигационных кнопок для `<a href>`: те же, что уходят в историю по
   * обычному клику, поэтому клик с модификатором открывает лист в новой вкладке.
   * `fork` кодируется асинхронно — до готовности пустая строка.
   */
  links: { fork: string }
  /** Привязка текстового поля по пути в шаблоне: field('people.0.name'). */
  field: (path: string) => FieldBinding
  setMode: (mode: DocMode) => void
  fork: () => void
  /** «Отмена» — шаг назад по истории; своего адреса, в отличие от форка, у неё нет. */
  cancel: () => void
  addPerson: () => void
  removePerson: (id: string) => void
  cycleFace: (id: string) => void
  /**
   * Подставляет состав семьи из кабинета: меняются только рисунок и имя,
   * содержимое карточек остаётся на своих местах (см. `replacePeople`
   * в `DocProvider`).
   */
  replacePeople: (members: FamilyPreset) => void
  stepMonth: (delta: number) => void
  setPalette: (palette: PaletteId) => void
  setIconSet: (iconSet: IconSetId) => void
  /** Актуальная ссылка на лист (дожидается кодирования, а не читает location). */
  buildShareUrl: () => Promise<string>
}

export const DocContext = createContext<DocValue | null>(null)

export function useDoc(): DocValue {
  const value = useContext(DocContext)
  if (!value) throw new Error('useDoc вызван вне <DocProvider>')
  return value
}
