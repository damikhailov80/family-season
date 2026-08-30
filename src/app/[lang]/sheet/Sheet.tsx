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
 * Черновик: постер, у которого ещё нет строки в базе.
 *
 * Содержимого в адресе больше нет — ни бланка, ни темы, ни набора рисунков.
 * Лист берёт их из `localStorage` (`src/model/draft.ts`), а режим по-прежнему
 * несёт путь: `/sheet` — просмотр, `/sheet/edit` — правка.
 *
 * Компонент грузится только в браузере (`ssr: false`), поэтому хранилище
 * доступно уже в первом рендере: паузы на чтение нет.
 */
export default function Sheet({ signedIn }: { signedIn: boolean }) {
  const lang = useLang()
  /*
   * Язык нового черновика — язык интерфейса: другого у него взяться неоткуда,
   * его собирают прямо сейчас и на том языке, что перед глазами. У готового
   * черновика язык свой, записанный при заведении, и переключение сайта его не
   * трогает — ровно как у строки в базе.
   */
  const [boot] = useState(() => readDraft() ?? emptyDraft(lang))
  /*
   * Путь берём у роутера, а не из `location`: при мягком переходе между
   * `/sheet` и `/sheet/edit` лист не перемонтируется (тот же элемент на том же
   * месте дерева), а адрес в `location` меняется уже после рендера — режим
   * отставал на один клик, и «Править» приходилось нажимать дважды.
   */
  const editing = modeFromPath(usePathname()) === 'edit'

  return (
    /* Имя черновика мимо провайдера: контекст знает только про бланк, а имя —
       про то, где сезон лежит и как называется в списке. */
    <SeasonProvider boot={{ ...boot, fillId: null }} mode={editing ? 'edit' : 'view'}>
      <DraftBar editing={editing} title={boot.title} signedIn={signedIn} />
      <FloatingControls />
      <Poster />
      <DraftStore title={boot.title} lang={boot.lang} />
    </SeasonProvider>
  )
}
