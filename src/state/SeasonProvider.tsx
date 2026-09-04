import { useCallback, useMemo, useState } from 'react'
import { fillOf } from '../model/examples'
import type { Lang } from '../model/lang'
import type { Template } from '../model/types'
import type { IconSetId, PaletteId } from '../types'
import type { DocMode, DocValue } from './docContext'
import { DocContext } from './docContext'
import { useTemplateState } from './useTemplateState'

/**
 * Постер, пришедший строкой из базы. Куда уезжают правки, провайдер не знает —
 * это дело страницы (`Autosave`, `DraftStore`).
 *
 * Куда деть переключённое оформление, решает тоже не он, а поставивший его
 * (`onDecorChange`): у выложенного сезона примерка уезжает пометками в адрес.
 */
export interface SeasonBoot {
  template: Template
  palette: PaletteId
  iconSet: IconSetId
  lang: Lang
  /** Набор заполнения — только у системных сезонов. */
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
  /** Зовётся с новой парой целиком: у оформления один смысл. */
  onDecorChange?: (decor: { palette: PaletteId; iconSet: IconSetId }) => void
  children: React.ReactNode
}) {
  const { template, days, field, addPerson, removePerson, cycleFace, replacePeople, stepMonth } =
    useTemplateState(boot.template)
  const [palette, setPaletteState] = useState<PaletteId>(boot.palette)
  const [iconSet, setIconSetState] = useState<IconSetId>(boot.iconSet)

  const fill = fillOf(boot.fillId)

  /*
   * Обёртки, а не эффект на изменение: эффект сработал бы и на первом рендере,
   * дописав перебивку в адрес, которого никто не трогал.
   */
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
