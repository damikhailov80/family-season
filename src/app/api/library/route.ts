import { safeSeasonUrl } from '../../../model/library'
import { findShared } from '../../../server/community'
import { findFavorite, findSeason } from '../../../server/library'

/**
 * Библиотека для **живого** постера. Лист клиентский (`ssr: false`) и до базы не
 * дотягивается, поэтому спрашивает её отсюда — как и состав семьи (`/api/family`).
 *
 * Своей обработки ошибок здесь нет намеренно: серверный модуль уже схлопнул все
 * беды в `null` — не вошёл, сессия без ключа, ничего не найдено, база молчит.
 * `null` значит «кнопка выглядит как „ещё не добавлено“», а не ошибку: постер
 * обязан работать без сервера.
 *
 *   ?url=<адрес постера>[&season=<uuid>] -> { favoriteId, season, shared }
 *
 * Все три ответа про один и тот же адрес, поэтому и запрос один: за каждым лишним
 * тянулся бы свой поход в базу на каждое изменение постера.
 *
 * Сезон ищется по пометке `s=`, а без неё — по самому адресу: тот же сезон,
 * пришедший обычной ссылкой, пометки не несёт, и без второго пути «Сохранить»
 * завела бы вторую такую же строку.
 *
 * `shared` — единственный ответ, который **не про этого человека**: выложен ли
 * сезон на витрину, знать может и аноним. Иначе ему нечего было бы нажать, а
 * предложение войти он должен получать в ответ на нажатие, как и со звёздочкой.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams
  const url = safeSeasonUrl(params.get('url'))
  const season = params.get('season')

  return Response.json({
    favoriteId: url ? await findFavorite(url) : null,
    season: url || season ? await findSeason(season, url) : null,
    shared: url ? await findShared(url) : null,
  })
}
