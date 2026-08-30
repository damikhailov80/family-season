import { notFound, redirect } from 'next/navigation'
import { Toast } from '../../../../components/site/Toast'
import { getDict, getLang } from '../../../../i18n/server'
import { fill } from '../../../../i18n/fill'
import { posterText } from '../../../../model/labels'
import { ROUTES, withLang } from '../../../../model/site'
import { readUserSeason } from '../../../../server/userSeasons'
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

  if (state.status === 'anonymous') redirect(withLang(await getLang(), ROUTES.seasons))
  if (state.status === 'missing') notFound()
  if (state.status === 'error') {
    const { pages } = await getDict()
    return <Toast message={pages.ownError} />
  }
  return <OwnSeason season={state.season} editing={editing} />
}

/** Название сезона в заголовке вкладки: у человека их сто, и они разные. */
export async function seasonMetadata(code: string) {
  const state = await readUserSeason(code)
  const { pages } = await getDict()
  // Запасное имя — на языке интерфейса: сезона мы не нашли, и его языка не знаем.
  const title =
    state.status === 'ok' ? state.season.title : posterText(await getLang()).untitled
  return { title: fill(pages.ownTitle, { title }) }
}
