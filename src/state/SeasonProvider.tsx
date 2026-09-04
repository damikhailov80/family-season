import { useCallback, useMemo, useState } from 'react'
import { fillOf } from '../model/examples'
import type { Lang } from '../model/lang'
import type { Template } from '../model/types'
import type { IconSetId, PaletteId } from '../types'
import type { DocMode, DocValue } from './docContext'
import { DocContext } from './docContext'
import { useTemplateState } from './useTemplateState'

export interface SeasonBoot {
  template: Template
  palette: PaletteId
  iconSet: IconSetId
  lang: Lang
  fillId: string | null
}

export function SeasonProvider({
  boot,
  mode = 'view',
  onDecorChange,
  children,
}: {
  boot: SeasonBoot
  mode?: DocMode
  onDecorChange?: (decor: { palette: PaletteId; iconSet: IconSetId }) => void
  children: React.ReactNode
}) {
  const { template, days, field, addPerson, removePerson, cycleFace, replacePeople, stepMonth } =
    useTemplateState(boot.template)
  const [palette, setPaletteState] = useState<PaletteId>(boot.palette)
  const [iconSet, setIconSetState] = useState<IconSetId>(boot.iconSet)

  const fill = fillOf(boot.fillId)

  const setPalette = useCallback(
    (next: PaletteId) => {
      setPaletteState(next)
      onDecorChange?.({ palette: next, iconSet })
    },
    [iconSet, onDecorChange],
  )

  const setIconSet = useCallback(
    (next: IconSetId) => {
      setIconSetState(next)
      onDecorChange?.({ palette, iconSet: next })
    },
    [palette, onDecorChange],
  )

  const value = useMemo<DocValue>(
    () => ({
      template,
      palette,
      iconSet,
      lang: boot.lang,
      fill,
      mode,
      days,
      editing: mode === 'edit',
      field,
      addPerson,
      removePerson,
      cycleFace,
      replacePeople,
      stepMonth,
      setPalette,
      setIconSet,
    }),
    [
      template,
      palette,
      iconSet,
      boot.lang,
      fill,
      mode,
      days,
      field,
      addPerson,
      removePerson,
      cycleFace,
      replacePeople,
      stepMonth,
      setPalette,
      setIconSet,
    ],
  )

  return <DocContext.Provider value={value}>{children}</DocContext.Provider>
}
