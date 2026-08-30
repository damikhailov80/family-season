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
 * Сам постер: всё, что нужно, чтобы его нарисовать и править.
 *
 * Контекст один и знает только про бланк. Всё, что вокруг постера — где он
 * лежит, куда сохраняется, что с ним можно сделать, — держат страницы: у
 * черновика, своего сезона и выложенного они разные, а сам лист один и тот же.
 */
export interface DocValue {
  template: Template
  /** Тема оформления. В бланк не входит: она хранится рядом с ним. */
  palette: PaletteId
  /** Набор рисунков. Тоже не бланк, и хранится так же, как тема. */
  iconSet: IconSetId
  /**
   * Язык **сезона**, а не интерфейса. Им подписан сам лист: месяц, подписи
   * секций, подсказки пустых полей — всё это печатается, и переключение языка
   * сайта его не трогает. Лежит рядом с бланком, как тема и набор рисунков.
   */
  lang: Lang
  fill: FillState
  mode: DocMode
  /** Число дней месяца — считается из темы, отдельного поля в модели нет. */
  days: number
  editing: boolean
  /** Привязка текстового поля по пути в шаблоне: field('people.0.name'). */
  field: (path: string) => FieldBinding
  addPerson: () => void
  removePerson: (id: string) => void
  cycleFace: (id: string) => void
  /**
   * Подставляет состав семьи из кабинета: меняются только рисунок и имя,
   * содержимое карточек остаётся на своих местах.
   */
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
 * Подписи листа — языком сезона. Отдельный хук рядом с `useDoc`, чтобы секции
 * не путали его с `useDict()`: тот отдаёт язык интерфейса и на бумагу не идёт.
 */
export function usePoster(): PosterText {
  return posterText(useDoc().lang)
}
