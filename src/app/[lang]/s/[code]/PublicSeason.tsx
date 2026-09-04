'use client'

import { useCallback } from 'react'
import { Poster } from '../../../../components/Poster'
import { FloatingControls } from '../../../../components/edit/FloatingControls'
import { useLang } from '../../../../i18n/context'
import { publicSeasonHref } from '../../../../model/site'
import { SeasonProvider } from '../../../../state/SeasonProvider'
import type { PublicSeasonView } from '../../../../server/publicSeasons'
import type { IconSetId, PaletteId } from '../../../../types'
import { PublicBar } from './PublicBar'

export function PublicSeason({
  season,
  signedIn,
  published,
}: {
  season: PublicSeasonView
  signedIn: boolean
  published: 'new' | 'again' | null
}) {
  const lang = useLang()
  const rememberDecor = useCallback(
    (decor: { palette: PaletteId; iconSet: IconSetId }) => {
      history.replaceState(history.state, '', publicSeasonHref(lang, season.code, decor))
    },
    [season.code, lang],
  )

  return (
    <SeasonProvider boot={season} onDecorChange={rememberDecor}>
      <PublicBar
        code={season.code}
        demo={Boolean(season.fillId)}
        signedIn={signedIn}
        mine={season.mine}
        system={season.system}
        hidden={season.hidden}
        published={published}
        state={{
          likes: season.likes,
          liked: season.liked,
          reported: season.reported,
          favorited: season.favorited,
        }}
      />
      <FloatingControls />
      <Poster />
    </SeasonProvider>
  )
}
