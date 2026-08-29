'use client'

import { useState, useTransition } from 'react'
import { NewSeasonDialog } from '../edit/NewSeasonDialog'
import {
  draftWillBeLost,
  emptyDraft,
  readDraft,
  writeDraft,
  type Draft,
} from '../../model/draft'
import { ROUTES } from '../../model/site'
import { createSeason } from '../../server/actions'

/**
 * «Новый сезон» — одна кнопка на весь сайт: в шапке, в кабинете, на лендинге, в
 * «Идеях», на `/account` и `/privacy`. Подпись и класс у мест разные, разговор —
 * один и тот же.
 *
 * Имя спрашивается **до** заведения, у обоих: раньше вошедший получал строку
 * молча, а невошедший — молча же открытый прежний черновик, и оба узнавали, что
 * случилось, только по результату.
 *
 * Умолчание имени считается здесь, на клиенте, и состава семьи не требует:
 * `defaultSeasonTitle` читает только тему бланка, а семья живёт в `people`.
 * Заодно это снимает расхождение «сегодня» между сервером и браузером — месяц
 * нового бланка зависит от даты.
 *
 * Цена перехода на окно: у вошедшего «Новый сезон» перестал работать без JS —
 * раньше это была `<form action={createSeason}>`. Принято сознательно: без JS
 * окна с именем не бывает, а молча заводить строку мы больше не хотим.
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

  /*
   * И черновик, и умолчание имени берутся в обработчике, а не в рендере.
   * Черновик — потому что серверный проход по клиентскому компоненту всё равно
   * идёт, а `localStorage` там нет: вышло бы расхождение разметки на ровном
   * месте. Умолчание — потому что месяц нового бланка считается от «сегодня»,
   * то есть `emptyDraft()` в рендере была бы нечистой функцией.
   */
  const ask = () =>
    setAsking({ draft: signedIn ? null : readDraft(), title: emptyDraft().title })

  const create = (title: string) => {
    if (!signedIn) {
      writeDraft({ ...emptyDraft(), title })
      location.assign(ROUTES.sheetEdit)
      return
    }
    // Действие кончается редиректом в любом случае, поэтому окно не закрываем:
    // `useTransition` держит ожидание сам, а свой флажок залип бы — маршрут
    // перерисовывается на месте, компонент не перемонтируется.
    start(() => createSeason(title))
  }

  return (
    <>
      <button type="button" className={className} disabled={busy} onClick={ask}>
        {children}
      </button>

      {asking && (
        <NewSeasonDialog
          heading="Новый сезон"
          warning={asking.draft ? draftWillBeLost(asking.draft.title) : undefined}
          initialTitle={asking.title}
          busy={busy}
          onDismiss={() => setAsking(null)}
          onSubmit={create}
        />
      )}
    </>
  )
}
