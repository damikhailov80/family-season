import { createContext, useContext } from 'react'
import { DEFAULT_ICON_SET } from '../../model/icons'
import type { IconSetId } from '../../types'

/**
 * Набор рисунков постера. Тему CSS раздаёт атрибутом `data-palette`, но
 * геометрию SVG подменить он не может, поэтому набор едет по контексту.
 *
 * Значение по умолчанию настоящее, а не `null`: постер бывает и без провайдера
 * (`/seasons` рисует голый `PaperSheet`), да и сайтовые доодлы зовут `Icon`
 * напрямую — им никакой набор не нужен.
 */
export const IconSetContext = createContext<IconSetId>(DEFAULT_ICON_SET)

export function useIconSet(): IconSetId {
  return useContext(IconSetContext)
}
