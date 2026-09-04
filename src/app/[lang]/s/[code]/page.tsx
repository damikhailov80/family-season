import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Toast } from '../../../../components/site/Toast'
import { getDict, getLang } from '../../../../i18n/server'
import { iconSetOrNull } from '../../../../model/icons'
import { paletteOrNull } from '../../../../model/palettes'
import { auth } from '../../../../server/auth'
import { readPublicSeason } from '../../../../server/publicSeasons'
import { PublicSeason } from './PublicSeason'

export async function generateMetadata(): Promise<Metadata> {
  const { pages } = await getDict()
  return { title: pages.publicTitle, description: pages.publicDescription }
}

export default async function PublicSeasonPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>
  searchParams: Promise<{ p?: string; i?: string; published?: string }>
}) {
  const { code } = await params
  const lang = await getLang()
  const [decor, state, session] = await Promise.all([
    searchParams,
    readPublicSeason(code, lang),
    auth(),
  ])

  if (state.status === 'missing') notFound()
  if (state.status === 'error') {
    const { pages } = await getDict()
    return <Toast message={pages.publicError} />
  }

  return (
    <PublicSeason
      season={{
        ...state.season,
        palette: paletteOrNull(decor.p) ?? state.season.palette,
        iconSet: iconSetOrNull(decor.i) ?? state.season.iconSet,
      }}
      signedIn={Boolean(session?.user)}
      published={decor.published === 'new' || decor.published === 'again' ? decor.published : null}
    />
  )
}
