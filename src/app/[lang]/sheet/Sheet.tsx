'use client'

import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Poster } from '../../../components/Poster'
import { FloatingControls } from '../../../components/edit/FloatingControls'
import { useLang } from '../../../i18n/context'
import { emptyDraft, readDraft } from '../../../model/draft'
import { modeFromPath } from '../../../model/site'
import { SeasonProvider } from '../../../state/SeasonProvider'
import { DraftBar } from './DraftBar'
import { DraftStore } from './DraftStore'

/**
 * Постер, у которого ещё нет строки в базе: содержимое лежит в `localStorage`.
 * Компонент грузится только в браузере (`ssr: false`), поэтому хранилище
 * доступно уже в первом рендере — паузы на чтение нет.
 */
export default function Sheet({ signedIn }: { signedIn: boolean }) {
  const lang = useLang()
  // Язык нового черновика — интерфейса; у готового свой, записанный при заведении.
  const [boot] = useState(() => readDraft() ?? emptyDraft(lang))
  /*
   * Путь берём у роутера, а не из `location`: при мягком переходе лист не
   * перемонтируется, а адрес в `location` меняется уже после рендера — режим
   * отставал на клик, и «Править» приходилось нажимать дважды.
   */
  const editing = modeFromPath(usePathname()) === 'edit'

  return (
    /* Имя мимо провайдера: контекст знает только про бланк. */
    <SeasonProvider boot={{ ...boot, fillId: null }} mode={editing ? 'edit' : 'view'}>
      <DraftBar editing={editing} title={boot.title} signedIn={signedIn} />
      <FloatingControls />
      <Poster />
      <DraftStore title={boot.title} lang={boot.lang} />
    </SeasonProvider>
  )
}
