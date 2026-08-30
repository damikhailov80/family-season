'use server'

import { redirect } from 'next/navigation'
import { signIn, signOut } from './auth'
import { readFamily, writeFamily, type FamilyStatus } from './settings'
import {
  addReport,
  noteFork,
  previewPublish,
  publishSeason,
  republishPublic,
  setFavorite,
  setLike,
  withdrawPublic,
} from './publicSeasons'
import {
  createUserSeason,
  dropShareToken,
  refreshShareToken,
  removeUserSeason,
  renameUserSeason,
  saveUserSeason,
} from './userSeasons'
import { normalizeTemplate } from '../model/codec'
import {
  normalizeComment,
  type PublishStatus,
  type ReactionStatus,
} from '../model/community'
import { normalizeFamily, templateForFamily } from '../model/family'
import { DEFAULT_ICON_SET, knownIconSet } from '../model/icons'
import { defaultSeasonTitle, normalizeTitle, type LibraryStatus } from '../model/library'
import { DEFAULT_PALETTE, knownPalette } from '../model/palettes'
import { ROUTES, seasonHref } from '../model/site'

/**
 * Вход и выход — серверные действия, а не клиентские хуки Auth.js: так в браузер
 * не уезжает ни строчки библиотеки. Разница между ними в том, куда уводят: выход
 * возвращает на свою же страницу и уходит редиректом, вход зовёт чужой сайт и
 * поэтому только отдаёт адрес — см. `googleLoginUrl`.
 */

/**
 * Адрес возврата после входа. Приходит из браузера, поэтому проверяем:
 * пускаем только свой относительный путь. `//host` — это протокол-относительный
 * адрес, то есть чужой сайт, и он бы превратил вход в открытый редирект.
 */
function safeReturnTo(value: unknown): string | null {
  if (typeof value !== 'string') return null
  if (!value.startsWith('/') || value.startsWith('//')) return null
  return value
}

/**
 * Адрес, куда Google спросит согласие. Действие **отдаёт ссылку, а не уводит
 * по ней**, и это не стилистика.
 *
 * `redirect()` из серверного действия отдаёт адрес роутеру Next, а тот у чужого
 * origin сперва просит у него RSC-ответ, получает от CORS отказ и только потом
 * откатывается к обычному переходу. Вход при этом работает, но в консоль каждый
 * раз падает «Failed to fetch RSC payload for accounts.google.com». Уводит
 * поэтому браузер (`location.href` в `GoogleLoginButton`) — роутеру тут делать
 * нечего, дальше всё равно чужой сайт.
 *
 * Куки входа (`state` и PKCE) от этого не теряются: их кладёт сам `signIn`
 * через `cookies()`, а не заголовки редиректа.
 */
export async function googleLoginUrl(returnTo?: unknown): Promise<string> {
  return signIn('google', {
    redirect: false,
    redirectTo: safeReturnTo(returnTo) ?? ROUTES.seasons,
  })
}

export async function logout() {
  // А после выхода — на лендинг: кабинет уже закрыт, показывать нечего.
  await signOut({ redirectTo: ROUTES.home })
}

/**
 * Сохранение состава семьи из кабинета.
 *
 * Состав приходит **аргументом, а не `FormData`**, и это не вкусовщина.
 * Действие зовёт клиентский компонент, а React в таком случае кодирует поля
 * формы под своими именами (`_1_name`, `_1_face`, …) — разбор по `getAll('name')`
 * молча возвращал бы пустоту. Аргумент React сериализует сам, и имя поля тут
 * ни при чём.
 *
 * Пришедшему не доверяем: `normalizeFamily` режет по границам 2..5, выкидывает
 * неизвестные лица и обрезает длину имени.
 *
 * Успех и неудача расходятся намеренно. Успех уезжает пометкой в адрес — ему
 * надо пережить перезагрузку, и страница всё равно перерисовывается новыми
 * данными. Неудаче переживать нечего: редирект перерисовал бы кабинет с нуля,
 * а набранного состава у сервера нет — он молча пропал бы, и повторять было бы
 * нечего. Поэтому статус возвращаем, и форма показывает его, не теряя ввод.
 */
export async function saveFamily(family: unknown): Promise<Exclude<FamilyStatus, 'ok'>> {
  const outcome = await writeFamily(normalizeFamily(family))
  if (outcome === 'ok') redirect(`${ROUTES.account}?ok=1`)
  return outcome
}

/**
 * Сезоны. Правила у этих действий те же, что у `saveFamily`: данные едут
 * **аргументом, а не `FormData`** (форму из клиентского компонента React кодирует
 * под своими именами), а пришедшему не доверяем — бланк и название проверяются
 * здесь, у самой записи.
 *
 * Успех и неудача расходятся так же: постеру статус нужен **значением** (он
 * никуда не уходит и терять набранное нельзя), а страница «Мои сезоны»
 * заканчивается редиректом — удаление обязано пережить перезагрузку.
 */
/**
 * Завести сезон из того, что сейчас на экране: черновик уезжает в кабинет, чужой
 * или свой постер форкается.
 *
 * Форк — **копия**, а не ссылка: от исходного сезона в новой строке не остаётся
 * ничего, и дальше он живёт сам по себе. Поэтому и повторный форк — это ещё одна
 * строка, а не отказ «уже есть».
 *
 * `from` — код выложенного сезона, с которого форкнули. Он нужен только
 * статистике автора («сколько людей взяло себе») и на саму строку не влияет:
 * не запишется — форк от этого не отменяется.
 */
export async function storeSeason(
  input: unknown,
): Promise<{ status: LibraryStatus; code?: string }> {
  const raw = (input ?? {}) as {
    title?: unknown
    template?: unknown
    palette?: unknown
    iconSet?: unknown
    from?: unknown
  }
  const created = await createUserSeason({
    title: normalizeTitle(raw.title),
    template: normalizeTemplate(raw.template),
    palette: knownPalette(raw.palette),
    iconSet: knownIconSet(raw.iconSet),
  })

  if (created.status === 'ok' && typeof raw.from === 'string') await noteFork(raw.from)
  return created
}

/**
 * «Новый сезон» для вошедшего: строка заводится сразу, и человек попадает уже в
 * свой сезон, а не в черновик. Состав семьи из кабинета подставляется здесь же —
 * постеру про базу знать по-прежнему нечего.
 *
 * Имя приходит из окна, а не считается молча: подставленное умолчание человек
 * видит и подтверждает. Пустое поле поэтому не отказ, а то же самое умолчание —
 * `normalizeTitle` подставит его вместо общего «Сезон».
 *
 * Неудача уезжает пометкой в адрес кабинета: страница всё равно перерисуется, а
 * рассказать о ней надо — молча вернуть человека «никуда» нельзя.
 */
export async function createSeason(title: unknown) {
  const family = await readFamily()
  const template = templateForFamily(family ?? [])
  const result = await createUserSeason({
    template,
    title: normalizeTitle(title, defaultSeasonTitle(template)),
    palette: DEFAULT_PALETTE,
    iconSet: DEFAULT_ICON_SET,
  })
  if (result.status === 'ok' && result.code) redirect(seasonHref(result.code, 'edit'))
  redirect(`${ROUTES.seasons}?add=${result.status}`)
}

/**
 * Автосохранение своего сезона. Зовётся дебаунсом с постера, поэтому пришедшему
 * не доверяем ровно так же, как всему остальному: бланк прогоняется через
 * `normalizeTemplate`, оформление — через свои проверки.
 */
export async function saveSeason(
  code: unknown,
  input: unknown,
): Promise<LibraryStatus> {
  if (typeof code !== 'string') return 'error'
  const raw = (input ?? {}) as { template?: unknown; palette?: unknown; iconSet?: unknown }
  return saveUserSeason(code, {
    template: normalizeTemplate(raw.template),
    palette: knownPalette(raw.palette),
    iconSet: knownIconSet(raw.iconSet),
  })
}

/**
 * Переименование своего сезона **с самого постера**. Отдельно от `renameEntry`
 * ровно потому, что кончается значением, а не редиректом: название правят прямо
 * в панели, постер под ней никуда не уходит и перерисовывать страницу незачем.
 */
export async function renameSeason(code: unknown, title: unknown): Promise<LibraryStatus> {
  if (typeof code !== 'string') return 'error'
  return renameUserSeason(code, normalizeTitle(title))
}

/**
 * Выложить свой сезон на витрину.
 *
 * Уезжает **код своего сезона**, а не бланк: копию с него сервер снимет сам,
 * из собственной строки. Иначе на витрину можно было бы положить что угодно,
 * не имея этого у себя.
 */
export async function shareSeason(
  code: unknown,
  anonymize: unknown,
): Promise<{ status: PublishStatus; code?: string; fresh?: boolean }> {
  if (typeof code !== 'string') return { status: 'error' }
  return publishSeason(code, Boolean(anonymize))
}

/**
 * Чем кончится публикация, если нажать прямо сейчас. Спрашивает окно, когда
 * открывается: разговор должен начинаться с ответа, а не кончаться им.
 */
export async function previewShare(
  code: unknown,
): Promise<{ status: PublishStatus; code?: string }> {
  if (typeof code !== 'string') return { status: 'error' }
  return previewPublish(code)
}

/** Убрать свою публикацию с витрины. Что с ней станет — решает `withdrawPublic`. */
export async function withdrawSeason(code: unknown): Promise<{ status: PublishStatus; hidden?: boolean }> {
  if (typeof code !== 'string') return { status: 'error' }
  return withdrawPublic(code)
}

/** Вернуть свою снятую публикацию на витрину — та же строка, тот же код. */
export async function republishSeason(code: unknown): Promise<PublishStatus> {
  if (typeof code !== 'string') return 'error'
  return republishPublic(code)
}

/**
 * Приватная ссылка на свой сезон: выдать (или заменить) и отозвать.
 *
 * Статус возвращается **значением**: постер под кнопкой никуда не уходит, а
 * новую ссылку человеку надо тут же показать и скопировать.
 */
export async function shareLink(code: unknown): Promise<{ status: LibraryStatus; token?: string }> {
  if (typeof code !== 'string') return { status: 'error' }
  return refreshShareToken(code)
}

export async function revokeLink(code: unknown): Promise<LibraryStatus> {
  if (typeof code !== 'string') return 'error'
  return dropShareToken(code)
}

/**
 * Лайк, звёздочка и жалоба — то, что делают с чужим выложенным сезоном.
 *
 * Желаемое состояние приходит от клиента, а не «переключи там сам»: так запрос
 * к базе один и идемпотентен, и повторное нажатие в соседней вкладке ничего не
 * ломает. Статус возвращается **значением**: постер под кнопкой никуда не идёт.
 */
export async function likeSeason(code: unknown, on: unknown): Promise<ReactionStatus> {
  if (typeof code !== 'string') return 'error'
  return setLike(code, Boolean(on))
}

export async function favoriteSeason(code: unknown, on: unknown): Promise<ReactionStatus> {
  if (typeof code !== 'string') return 'error'
  return setFavorite(code, Boolean(on))
}

/**
 * Жалоба. Без комментария не принимаем: жалоба без слов бесполезна тому, кто
 * будет в ней разбираться. Окно пустую и не отправит — это проверка у записи.
 */
export async function reportSeason(code: unknown, comment: unknown): Promise<ReactionStatus> {
  const text = normalizeComment(comment)
  if (typeof code !== 'string' || !text) return 'error'
  return addReport(code, text)
}

/**
 * Удаление со страницы. Вид списка и id привязаны к действию в серверном
 * компоненте, но привязанные аргументы уезжают в браузер и возвращаются оттуда —
 * поэтому проверяются наравне со всем остальным, включая адрес возврата.
 */
export async function renameEntry(code: unknown, back: unknown, title: unknown) {
  if (typeof code === 'string') await renameUserSeason(code, normalizeTitle(title))
  redirect(safeReturnTo(back) ?? ROUTES.seasons)
}

/**
 * Убрать свою публикацию с витрины **со страницы списка**. Отдельно от
 * `withdrawSeason` ровно потому, что кончается редиректом, а не значением:
 * списку надо перерисоваться и пережить перезагрузку.
 */
export async function withdrawEntry(code: unknown, back: unknown) {
  if (typeof code === 'string') await withdrawPublic(code)
  redirect(safeReturnTo(back) ?? `${ROUTES.seasons}?tab=published`)
}

/** Вернуть публикацию на витрину **со страницы списка** — та же пара, что выше. */
export async function republishEntry(code: unknown, back: unknown) {
  if (typeof code === 'string') await republishPublic(code)
  redirect(safeReturnTo(back) ?? `${ROUTES.seasons}?tab=published`)
}

/**
 * Убрать отложенное из кабинета. Отдельно от `favoriteSeason` ровно потому, что
 * кончается **редиректом**, а не значением: списку надо перерисоваться и пережить
 * перезагрузку. То же различие, что у `storeSeason` и `dropEntry`.
 */
export async function unfavoriteEntry(code: unknown, back: unknown) {
  if (typeof code === 'string') await setFavorite(code, false)
  redirect(safeReturnTo(back) ?? ROUTES.seasons)
}

export async function dropEntry(code: unknown, back: unknown) {
  if (typeof code === 'string') await removeUserSeason(code)
  redirect(safeReturnTo(back) ?? ROUTES.seasons)
}
