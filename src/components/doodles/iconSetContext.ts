import { createContext, useContext } from 'react'
import { DEFAULT_ICON_SET } from '../../model/icons'
import type { IconSetId } from '../../types'

/**
 * Тему CSS раздаёт атрибутом, но геометрию SVG им не подменишь — набор едет по
 * контексту. Значение по умолчанию настоящее, а не `null`: постер бывает и без
 * провайдера (`/seasons` рисует голый `PaperSheet`).
 */
export const IconSetContext = createContext<IconSetId>(DEFAULT_ICON_SET)

export function useIconSet(): IconSetId {
  return useContext(IconSetContext)
}
