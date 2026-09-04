import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Toast } from '../../../../components/site/Toast'
import { getDict } from '../../../../i18n/server'
import { auth } from '../../../../server/auth'
import { shareQr } from '../../../../server/qr'
import { readSharedSeason } from '../../../../server/userSeasons'
import { SharedSeason } from './SharedSeason'

export async function generateMetadata(): Promise<Metadata> {
  const { pages } = await getDict()
  return { title: pages.sharedTitle, description: pages.sharedDescription }
}

/**
 * Открывается кому угодно и без входа — в том и смысл ссылки. Вход спрашиваем
 * только затем, чтобы знать, куда ляжет форк.
 *
 * Отозванная ссылка неотличима от выдуманной: по ответу не должно быть видно,
 * существовал ли когда-нибудь токен.
 */
export default async function SharedSeasonPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const [state, session] = await Promise.all([readSharedSeason(token), auth()])

  if (state.status === 'missing' || state.status === 'anonymous') notFound()
  if (state.status === 'error') {
    const { pages } = await getDict()
    return <Toast message={pages.sharedError} />
  }
  /* Код на листе — та самая ссылка, по которой сезон открыт: распечатку показывают
     дальше, а шестнадцать знаков токена с бумаги никто не наберёт. */
  return (
    <SharedSeason
      season={state.season}
      signedIn={Boolean(session?.user)}
      qr={shareQr(state.season.lang, token)}
    />
  )
}
