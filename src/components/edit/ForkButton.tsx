'use client'

import { useState } from 'react'
import { useDict, useLang } from '../../i18n/context'
import { fill } from '../../i18n/fill'
import { readDraft, writeDraft, type Draft } from '../../model/draft'
import { defaultSeasonTitle, libraryText } from '../../model/library'
import { seasonHref, sheetHref } from '../../model/site'
import { storeSeason } from '../../server/actions'
import { useDoc } from '../../state/docContext'
import { NewSeasonDialog } from './NewSeasonDialog'
import styles from './Bar.module.css'

/**
 * Один компонент на все чужие постеры: выложенный и присланный по личной ссылке
 * форкаются одинаково.
 *
 * Форк копирует то, что на экране, вместе с примеренной темой и набором рисунков:
 * человек берёт себе увиденное, а не строку из базы. Слой заполнения не
 * копируется никогда — он не часть бланка.
 *
 * Окно рисуется прямо здесь, внутри бара, и это можно: модальный `<dialog>` живёт
 * в верхнем слое, `backdrop-filter` ему не помеха — в отличие от тоста, поэтому
 * об отказе кнопка не рассказывает сама, а отдаёт его наружу.
 */
export function ForkButton({
  signedIn,
  from,
  onFailure,
}: {
  signedIn: boolean
  /** Код выложенного сезона, если форкают его: нужен статистике автора. */
  from?: string
  onFailure: (text: string) => void
}) {
  const { template, palette, iconSet, lang } = useDoc()
  const uiLang = useLang()
  const { dialogs } = useDict()
  /* Черновик читаем при открытии окна, а не в рендере: на сервере хранилища нет,
     и в первом проходе ответ был бы неправдой. */
  const [asking, setAsking] = useState<{ draft: Draft | null } | null>(null)
  const [busy, setBusy] = useState(false)

  const fork = async (title: string) => {
    // Язык копируется вместе с бланком: подписи листа — часть увиденного.
    if (!signedIn) {
      writeDraft({ title, template, palette, iconSet, lang })
      location.assign(sheetHref(uiLang, 'edit'))
      return
    }

    setBusy(true)
    const result = await storeSeason({ title, template, palette, iconSet, lang, from })
    setBusy(false)
    setAsking(null)
    if (result.status === 'ok' && result.code) {
      location.assign(seasonHref(uiLang, result.code, 'edit'))
      return
    }
    // `anonymous` сюда не приходит: вход у страницы спрошен заранее.
    onFailure(libraryText(uiLang, result.status as 'limit' | 'stale' | 'error'))
  }

  return (
    <>
      <button
        type="button"
        className={styles.primary}
        disabled={busy}
        onClick={() => setAsking({ draft: signedIn ? null : readDraft() })}
      >
        {dialogs.forkAction}
      </button>

      {asking && (
        <NewSeasonDialog
          heading={dialogs.fork}
          warning={
            asking.draft ? fill(dialogs.draftWillBeLost, { title: asking.draft.title }) : undefined
          }
          initialTitle={defaultSeasonTitle(template, lang)}
          busy={busy}
          onDismiss={() => setAsking(null)}
          onSubmit={(title) => void fork(title)}
        />
      )}
    </>
  )
}
