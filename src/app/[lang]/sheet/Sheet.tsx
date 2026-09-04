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

export default function Sheet({ signedIn }: { signedIn: boolean }) {
  const lang = useLang()
  const [boot] = useState(() => readDraft() ?? emptyDraft(lang))
  const editing = modeFromPath(usePathname()) === 'edit'

  return (
    <SeasonProvider boot={{ ...boot, fillId: null }} mode={editing ? 'edit' : 'view'}>
      <DraftBar editing={editing} title={boot.title} signedIn={signedIn} />
      <FloatingControls />
      <Poster />
      <DraftStore title={boot.title} lang={boot.lang} />
    </SeasonProvider>
  )
}
