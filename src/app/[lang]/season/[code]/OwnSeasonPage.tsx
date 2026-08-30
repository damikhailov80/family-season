import { notFound, redirect } from 'next/navigation'
import { Toast } from '../../../components/site/Toast'
import { ROUTES } from '../../../model/site'
import { readUserSeason } from '../../../server/userSeasons'
import { OwnSeason } from './OwnSeason'

/**
 * Общая часть двух страниц своего сезона — просмотра и правки. Режим несёт путь,
 * поэтому страниц две, а различаются они одним флагом.
 *
 * Невошедшего уводим в кабинет: там объяснено, зачем вход, и стоит кнопка. Голый
 * 404 на своей же закладке был бы честным, но бесполезным.
 *
 * Чужой и выдуманный код неразличимы намеренно: по ответу не должно быть видно,
 * существует ли чужой сезон.
 */
export async function OwnSeasonPage({ code, editing }: { code: string; editing: boolean }) {
  const state = await readUserSeason(code)

  if (state.status === 'anonymous') redirect(ROUTES.seasons)
  if (state.status === 'missing') notFound()
  if (state.status === 'error') {
    return <Toast message="Не удалось открыть сезон — ошибка на сервере." />
  }
  return <OwnSeason season={state.season} editing={editing} />
}

/** Название сезона в заголовке вкладки: у человека их сто, и они разные. */
export async function seasonMetadata(code: string) {
  const state = await readUserSeason(code)
  const title = state.status === 'ok' ? state.season.title : 'Сезон'
  return { title: `${title} — Семейный сезон` }
}
