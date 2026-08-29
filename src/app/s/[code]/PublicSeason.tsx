'use client'

import { useCallback } from 'react'
import { Poster } from '../../../components/Poster'
import { FloatingControls } from '../../../components/edit/FloatingControls'
import { publicSeasonHref } from '../../../model/site'
import { SeasonProvider } from '../../../state/SeasonProvider'
import type { PublicSeasonView } from '../../../server/publicSeasons'
import type { IconSetId, PaletteId } from '../../../types'
import { PublicBar } from './PublicBar'

/**
 * Клиентская часть выложенного сезона. Содержимое приходит **пропсом от
 * сервера**, а не из адреса: в адресе теперь только код строки.
 *
 * Примеренное оформление, наоборот, в адрес уезжает — перебивкой `?p=&i=`,
 * чтобы ссылку на увиденное можно было отослать. Строку в базе это не трогает.
 */
export function PublicSeason({
  season,
  signedIn,
  published,
}: {
  season: PublicSeasonView
  /** Ответ известен заранее: страница серверная. От него зависит, куда ляжет форк. */
  signedIn: boolean
  /** Пришли прямо с публикации — панель скажет, что случилось, и почистит адрес. */
  published: 'new' | 'again' | null
}) {
  /*
   * `replaceState`, а не переход роутера: содержимое от адреса не зависит,
   * перерисовывать страницу незачем, а лишняя запись в истории превратила бы
   * «назад» в перебор примеренных тем. `history.state` передаём обязательно —
   * иначе патченный Next-ом вызов пойдёт мимо короткого пути (см. «Каркас»).
   */
  const rememberDecor = useCallback(
    (decor: { palette: PaletteId; iconSet: IconSetId }) => {
      history.replaceState(history.state, '', publicSeasonHref(season.code, decor))
    },
    [season.code],
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
