'use client'

import { useState } from 'react'
import { Poster } from '../../../../components/Poster'
import { FloatingControls } from '../../../../components/edit/FloatingControls'
import type { SharedLink } from '../../../../model/qr'
import { SeasonProvider } from '../../../../state/SeasonProvider'
import type { UserSeason } from '../../../../server/userSeasons'
import { Autosave } from './Autosave'
import { OwnBar } from './OwnBar'

/**
 * Свой сезон: содержимое приходит пропсом от сервера, а правки уезжают обратно
 * сами. Ни хэша, ни кодирования — в адресе только код строки.
 */
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
   * Ссылка живёт здесь, а не в панели: выдают и отзывают её окном из панели, а
   * печатает её QR на самом листе — состояние у них одно на двоих. Ответ
   * известен из самого действия, поэтому страницу за ним не переспрашиваем.
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
