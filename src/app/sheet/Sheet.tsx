'use client'

import { useState } from 'react'
import { Poster } from '../../components/Poster'
import { FloatingControls } from '../../components/edit/FloatingControls'
import { emptyDraft, readDraft } from '../../model/draft'
import { modeFromPath } from '../../model/site'
import { SeasonProvider } from '../../state/SeasonProvider'
import { DraftBar } from './DraftBar'
import { DraftStore } from './DraftStore'

/**
 * Черновик: постер, у которого ещё нет строки в базе.
 *
 * Содержимого в адресе больше нет — ни бланка, ни темы, ни набора рисунков.
 * Лист берёт их из `localStorage` (`src/model/draft.ts`), а режим по-прежнему
 * несёт путь: `/sheet` — просмотр, `/sheet/edit` — правка.
 *
 * Компонент грузится только в браузере (`ssr: false`), поэтому и `location`, и
 * хранилище доступны уже в первом рендере: паузы на чтение нет.
 */
export default function Sheet() {
  const [boot] = useState(() => readDraft() ?? emptyDraft())
  const editing = modeFromPath() === 'edit'

  return (
    <SeasonProvider boot={{ ...boot, fillId: null }} mode={editing ? 'edit' : 'view'}>
      <DraftBar editing={editing} />
      <FloatingControls />
      <Poster />
      <DraftStore />
    </SeasonProvider>
  )
}
