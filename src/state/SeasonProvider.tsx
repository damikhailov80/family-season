import { useCallback, useMemo, useState } from 'react'
import { fillOf } from '../model/examples'
import type { Template } from '../model/types'
import type { IconSetId, PaletteId } from '../types'
import type { DocMode, DocValue } from './docContext'
import { DocContext } from './docContext'
import { useTemplateState } from './useTemplateState'

/**
 * Постер, пришедший **строкой из базы**: публичный сезон, свой сохранённый,
 * открытый по приватной ссылке.
 *
 * Ни хэша, ни истории, ни кодирования: адрес такого постера — короткий код строки
 * и меняться не может, поэтому и синхронизировать с ним нечего. Куда уезжают
 * правки, провайдер не знает — это дело страницы (`Autosave`, `DraftStore`).
 *
 * Тема и набор рисунков переключаются, но строку не меняют: на чужом постере это
 * примерка. Куда деть примеренное, решает не провайдер, а тот, кто его поставил, —
 * `onDecorChange`: у выложенного сезона оформление уезжает перебивкой в адрес
 * (`?p=&i=`), чтобы ссылку на «вот так это выглядит в лимонной теме» можно было
 * скопировать и отослать.
 */
export interface SeasonBoot {
  template: Template
  palette: PaletteId
  iconSet: IconSetId
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
  /** Режим несёт путь страницы: `/season/<code>` против `/season/<code>/edit`. */
  mode?: DocMode
  /** Оформление сменили. Зовётся с новой парой целиком: у неё один смысл. */
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
   * дописав перебивку в адрес, которого никто не трогал. Пара уезжает целиком —
   * в адресе должны стоять обе пометки, иначе присланная ссылка покажет чужую
   * тему со своими рисунками.
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
