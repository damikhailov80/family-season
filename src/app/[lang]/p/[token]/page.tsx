import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Toast } from '../../../components/site/Toast'
import { auth } from '../../../server/auth'
import { readSharedSeason } from '../../../server/userSeasons'
import { SharedSeason } from './SharedSeason'

export const metadata: Metadata = {
  title: 'Сезон по ссылке — Семейный сезон',
  description: 'Семейный сезон, которым с вами поделились: посмотрите и заберите себе.',
}

/**
 * Сезон по личной ссылке.
 *
 * Открывается **кому угодно и без входа** — в том и смысл ссылки: её отправляют
 * тому, у кого аккаунта нет. Вход спрашиваем только затем, чтобы знать, куда
 * ляжет форк.
 *
 * Отозванная ссылка ничем не отличается от выдуманной: и то и другое — 404.
 * Так и надо: по ответу не должно быть видно, существовал ли когда-нибудь токен.
 */
export default async function SharedSeasonPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const [state, session] = await Promise.all([readSharedSeason(token), auth()])

  if (state.status === 'missing' || state.status === 'anonymous') notFound()
  if (state.status === 'error') {
    return <Toast message="Не удалось открыть сезон — ошибка на сервере." />
  }
  return <SharedSeason season={state.season} signedIn={Boolean(session?.user)} />
}
