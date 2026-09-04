import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Toast } from '../../../../components/site/Toast'
import { getDict, getLang } from '../../../../i18n/server'
import { fill } from '../../../../i18n/fill'
import { pageMeta } from '../../../../model/meta'
import { ROUTES } from '../../../../model/site'
import { auth } from '../../../../server/auth'
import { shareQr } from '../../../../server/qr'
import { readSharedSeason } from '../../../../server/userSeasons'
import { SharedSeason } from './SharedSeason'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>
}): Promise<Metadata> {
  const { token } = await params
  const [state, { pages, site }] = await Promise.all([readSharedSeason(token), getDict()])
  return pageMeta({
    lang: await getLang(),
    path: `${ROUTES.shared}/${token}`,
    // The name the owner gave the row: the month, the year and the theme of the month. It is
    // what the link is sent for, and it is the only thing a messenger card can say about the
    // season without a picture. Names are not in it - they live apart from the content.
    title:
      state.status === 'ok'
        ? fill(pages.ownTitle, { title: state.season.title })
        : pages.sharedTitle,
    description: pages.sharedDescription,
    siteName: site.brand,
    ogAlt: site.ogAlt,
    index: false,
  })
}

export default async function SharedSeasonPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const [state, session] = await Promise.all([readSharedSeason(token), auth()])

  if (state.status === 'missing' || state.status === 'anonymous') notFound()
  if (state.status === 'error') {
    const { pages } = await getDict()
    return <Toast message={pages.sharedError} />
  }
  return (
    <SharedSeason
      season={state.season}
      signedIn={Boolean(session?.user)}
      qr={shareQr(state.season.lang, token)}
    />
  )
}
