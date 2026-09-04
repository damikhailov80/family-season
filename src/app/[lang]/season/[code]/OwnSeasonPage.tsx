import { notFound, redirect } from 'next/navigation'
import { Toast } from '../../../../components/site/Toast'
import { getDict, getLang } from '../../../../i18n/server'
import { fill } from '../../../../i18n/fill'
import { posterText } from '../../../../model/labels'
import { ROUTES, withLang } from '../../../../model/site'
import { sharedLink } from '../../../../server/qr'
import { readUserSeason } from '../../../../server/userSeasons'
import { OwnSeason } from './OwnSeason'

export async function OwnSeasonPage({ code, editing }: { code: string; editing: boolean }) {
  const state = await readUserSeason(code)

  if (state.status === 'anonymous') redirect(withLang(await getLang(), ROUTES.seasons))
  if (state.status === 'missing') notFound()
  if (state.status === 'error') {
    const { pages } = await getDict()
    return <Toast message={pages.ownError} />
  }
  return <OwnSeason season={state.season} editing={editing} share={sharedLink(state.season)} />
}

export async function seasonMetadata(code: string) {
  const state = await readUserSeason(code)
  const { pages } = await getDict()
  const title = state.status === 'ok' ? state.season.title : posterText(await getLang()).untitled
  return { title: fill(pages.ownTitle, { title }) }
}
