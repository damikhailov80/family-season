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

export function ForkButton({
  signedIn,
  from,
  onFailure,
}: {
  signedIn: boolean
  from?: string
  onFailure: (text: string) => void
}) {
  const { template, palette, iconSet, lang } = useDoc()
  const uiLang = useLang()
  const { dialogs } = useDict()
  const [asking, setAsking] = useState<{ draft: Draft | null } | null>(null)
  const [busy, setBusy] = useState(false)

  const fork = async (title: string) => {
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
