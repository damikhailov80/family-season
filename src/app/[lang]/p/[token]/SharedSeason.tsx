'use client'

import { Poster } from '../../../../components/Poster'
import { FloatingControls } from '../../../../components/edit/FloatingControls'
import type { QrMatrix } from '../../../../model/qr'
import { SeasonProvider } from '../../../../state/SeasonProvider'
import type { UserSeason } from '../../../../server/userSeasons'
import { SharedBar } from './SharedBar'

/**
 * Тема и рисунки переключаются, но никуда не уезжают — ни в строку (она чужая),
 * ни в адрес (он выдан хозяином, и дописывать в него перебивку значило бы портить
 * присланную ссылку). Это примерка перед форком.
 */
export function SharedSeason({
  season,
  signedIn,
  qr,
}: {
  season: UserSeason
  signedIn: boolean
  /** Код этой же ссылки: её печатают вместе с листом. */
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
