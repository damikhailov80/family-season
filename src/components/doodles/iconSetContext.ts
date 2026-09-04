import { createContext, useContext } from 'react'
import { DEFAULT_ICON_SET } from '../../model/icons'
import type { IconSetId } from '../../types'

export const IconSetContext = createContext<IconSetId>(DEFAULT_ICON_SET)

export function useIconSet(): IconSetId {
  return useContext(IconSetContext)
}
