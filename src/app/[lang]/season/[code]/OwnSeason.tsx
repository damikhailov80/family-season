'use client'

import { useState } from 'react'
import { Poster } from '../../../../components/Poster'
import { FloatingControls } from '../../../../components/edit/FloatingControls'
import type { SharedLink } from '../../../../model/qr'
import { SeasonProvider } from '../../../../state/SeasonProvider'
import type { UserSeason } from '../../../../server/userSeasons'
import { Autosave } from './Autosave'
import { OwnBar } from './OwnBar'

export function OwnSeason({
  season,
  editing,
  share,
}: {
  season: UserSeason
  editing: boolean
  /** Личная ссылка с готовым кодом; `null` — её не выдавали. */
  share: SharedLink | null
}) {
  /*
   * Ссылка живёт здесь, а не в панели: выдают её окном из панели, а печатает лист —
   * состояние у них одно на двоих.
   */
  const [link, setLink] = useState(share)

  return (
    <SeasonProvider boot={{ ...season, fillId: null }} mode={editing ? 'edit' : 'view'}>
      <OwnBar
        code={season.code}
        editing={editing}
        title={season.title}
        link={link}
        onLink={setLink}
      />
      <FloatingControls />
      <Poster qr={link?.qr} />
      <Autosave code={season.code} />
    </SeasonProvider>
  )
}
