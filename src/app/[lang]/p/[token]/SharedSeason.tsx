'use client'

import { Poster } from '../../../../components/Poster'
import { FloatingControls } from '../../../../components/edit/FloatingControls'
import type { QrMatrix } from '../../../../model/qr'
import { SeasonProvider } from '../../../../state/SeasonProvider'
import type { UserSeason } from '../../../../server/userSeasons'
import { SharedBar } from './SharedBar'

export function SharedSeason({
  season,
  signedIn,
  qr,
}: {
  season: UserSeason
  signedIn: boolean
  qr: QrMatrix
}) {
  return (
    <SeasonProvider boot={{ ...season, fillId: null }}>
      <SharedBar signedIn={signedIn} />
      <FloatingControls />
      <Poster qr={qr} />
    </SeasonProvider>
  )
}
