'use client'

import { Poster } from '../../../../components/Poster'
import { FloatingControls } from '../../../../components/edit/FloatingControls'
import { SeasonProvider } from '../../../../state/SeasonProvider'
import type { UserSeason } from '../../../../server/userSeasons'
import { SharedBar } from './SharedBar'

/**
 * Чужой сезон, открытый по личной ссылке: только просмотр и форк.
 *
 * Тема и рисунки переключаются, но никуда не уезжают — ни в строку (она чужая),
 * ни в адрес (адрес тут не свой, а выданный хозяином, и дописывать в него
 * перебивку значило бы портить присланную ссылку). Это примерка перед форком.
 */
export function SharedSeason({
  season,
  signedIn,
}: {
  season: UserSeason
  signedIn: boolean
}) {
  return (
    <SeasonProvider boot={{ ...season, fillId: null }}>
      <SharedBar signedIn={signedIn} />
      <FloatingControls />
      <Poster />
    </SeasonProvider>
  )
}
