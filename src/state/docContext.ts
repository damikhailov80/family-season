import { createContext, useContext } from 'react'
import type { PaletteId } from '../types'
import type { FillState, Template } from '../model/types'

export type DocMode = 'view' | 'edit'

/** demo — пример главной страницы, custom — свой лист (форк или пустой). */
export type DocSource = 'demo' | 'custom'

export interface FieldBinding {
  value: string
  onChange: (value: string) => void
}

export interface DocValue {
  template: Template
  /** Тема оформления. В бланк не входит: её несёт пометка `p=` в адресе. */
  palette: PaletteId
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
  links: { fork: string; demo: string }
  /** Привязка текстового поля по пути в шаблоне: field('people.0.name'). */
  field: (path: string) => FieldBinding
  setMode: (mode: DocMode) => void
  fork: () => void
  openDemo: () => void
  addPerson: () => void
  removePerson: (id: string) => void
  cycleFace: (id: string) => void
  stepMonth: (delta: number) => void
  setPalette: (palette: PaletteId) => void
  /** Актуальная ссылка на лист (дожидается кодирования, а не читает location). */
  buildShareUrl: () => Promise<string>
}

export const DocContext = createContext<DocValue | null>(null)

export function useDoc(): DocValue {
  const value = useContext(DocContext)
  if (!value) throw new Error('useDoc вызван вне <DocProvider>')
  return value
}
