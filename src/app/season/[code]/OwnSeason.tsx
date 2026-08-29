'use client'

import { Poster } from '../../../components/Poster'
import { FloatingControls } from '../../../components/edit/FloatingControls'
import { SeasonProvider } from '../../../state/SeasonProvider'
import type { UserSeason } from '../../../server/userSeasons'
import { Autosave } from './Autosave'
import { OwnBar } from './OwnBar'

/**
 * Свой сезон: содержимое приходит пропсом от сервера, а правки уезжают обратно
 * сами. Ни хэша, ни кодирования — в адресе только код строки.
 */
export function OwnSeason({ season, editing }: { season: UserSeason; editing: boolean }) {
  return (
    <SeasonProvider boot={{ ...season, fillId: null }} mode={editing ? 'edit' : 'view'}>
      <OwnBar
        code={season.code}
        editing={editing}
        title={season.title}
        token={season.shareToken}
      />
      <FloatingControls />
      <Poster />
      <Autosave code={season.code} />
    </SeasonProvider>
  )
}
