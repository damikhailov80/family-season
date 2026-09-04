'use client'

import { useState, useTransition } from 'react'
import { NewSeasonDialog } from '../edit/NewSeasonDialog'
import { useDict, useLang } from '../../i18n/context'
import { fill } from '../../i18n/fill'
import { emptyDraft, readDraft, writeDraft, type Draft } from '../../model/draft'
import { sheetHref } from '../../model/site'
import { createSeason } from '../../server/actions'

/**
 * «Новый сезон» — одна кнопка на весь сайт; имя спрашивается до заведения у обеих
 * ролей. Умолчание считается здесь, на клиенте: так снимается расхождение
 * «сегодня» между сервером и браузером — месяц нового бланка зависит от даты.
 *
 * Цена: у вошедшего кнопка перестала работать без JS (была
 * `<form action={createSeason}>`) — без JS окна с именем не бывает.
 */
export function NewSeasonButton({
  signedIn,
  className,
  children,
}: {
  signedIn: boolean
  className?: string
  children: React.ReactNode
}) {
  const [asking, setAsking] = useState<{ draft: Draft | null; title: string } | null>(null)
  const [busy, start] = useTransition()
  const lang = useLang()
  const { dialogs } = useDict()

  /*
   * И черновик, и умолчание имени берутся в обработчике, а не в рендере: в
   * серверном проходе `localStorage` нет (вышло бы расхождение разметки), а
   * `emptyDraft()` считает месяц от «сегодня» и в рендере была бы нечистой.
   */
  const ask = () =>
    setAsking({ draft: signedIn ? null : readDraft(), title: emptyDraft(lang).title })

  const create = (title: string) => {
    if (!signedIn) {
      // Новый черновик собирается языком интерфейса: другого у него нет.
      writeDraft({ ...emptyDraft(lang), title })
      location.assign(sheetHref(lang, 'edit'))
      return
    }
    // Свой флажок ожидания залип бы: маршрут перерисовывается на месте, и
    // компонент после редиректа не перемонтируется. Держит его `useTransition`.
    start(() => createSeason(title, lang))
  }

  return (
    <>
      <button type="button" className={className} disabled={busy} onClick={ask}>
        {children}
      </button>

      {asking && (
        <NewSeasonDialog
          heading={dialogs.newSeason}
          warning={
            asking.draft ? fill(dialogs.draftWillBeLost, { title: asking.draft.title }) : undefined
          }
          initialTitle={asking.title}
          busy={busy}
          onDismiss={() => setAsking(null)}
          onSubmit={create}
        />
      )}
    </>
  )
}
