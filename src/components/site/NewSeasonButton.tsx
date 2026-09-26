'use client'

import { useState, useTransition } from 'react'
import { NewSeasonDialog } from '../edit/NewSeasonDialog'
import { useDict, useLang } from '../../i18n/context'
import { fill } from '../../i18n/fill'
import { emptyDraft, readDraft, writeDraft, type Draft } from '../../model/draft'
import { sheetHref } from '../../model/site'
import type { MonthRef } from '../../model/types'
import { createSeason } from '../../server/actions'

export function NewSeasonButton({
  signedIn,
  className,
  month,
  children,
}: {
  signedIn: boolean
  className?: string
  month?: MonthRef
  children: React.ReactNode
}) {
  const [asking, setAsking] = useState<{ draft: Draft | null; title: string } | null>(null)
  const [busy, start] = useTransition()
  const lang = useLang()
  const { dialogs } = useDict()

  const ask = () =>
    setAsking({ draft: signedIn ? null : readDraft(), title: emptyDraft(lang, month).title })

  const create = (title: string) => {
    if (!signedIn) {
      writeDraft({ ...emptyDraft(lang, month), title })
      location.assign(sheetHref(lang, 'edit'))
      return
    }
    start(() => createSeason(title, lang, month))
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
