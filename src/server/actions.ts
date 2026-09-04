'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { signIn, signOut } from './auth'
import { shareQr } from './qr'
import { readFamily, writeConsent, writeFamily, writeLanguage, type FamilyStatus } from './settings'
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
import { normalizeComment, type PublishStatus, type ReactionStatus } from '../model/community'
import {
  CONSENT_COOKIE,
  CONSENT_COOKIE_MAX_AGE,
  consentCookieValue,
  consentOrNull,
  type Consent,
} from '../model/consent'
import { normalizeFamily, templateForFamily } from '../model/family'
import { DEFAULT_ICON_SET, knownIconSet } from '../model/icons'
import { knownLang, LANG_COOKIE, LANG_COOKIE_MAX_AGE } from '../model/lang'
import { posterText } from '../model/labels'
import { defaultSeasonTitle, normalizeTitle, type LibraryStatus } from '../model/library'
import type { SharedLink } from '../model/qr'
import { DEFAULT_PALETTE, knownPalette } from '../model/palettes'
import { ROUTES, seasonHref, stripLang, withLang } from '../model/site'

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
  /*
   * Возвращаемся на ту же страницу, но **без языка в адресе**, и это не мелочь.
   *
   * Язык в пути `proxy` считает выбором человека и настройке из базы уступает
   * (см. «Языки» в CLAUDE.md). Вернув `/en/ideas` как есть, мы бы сказали ровно
   * это — «человек выбрал английский», — и вошедший с русской настройкой так и
   * остался бы на английском: вход это ведь и есть «заход на сайт», где язык
   * берётся из базы. Отдаём голый путь — `proxy` подставит язык сам, пометит
   * это как `auto`, и настройка победит.
   *
   * Страницу при этом не теряем: возвращается тот же путь и та же примерка
   * оформления в `?p=` и `?i=`.
   */
  return signIn('google', {
    redirect: false,
    redirectTo: stripLang(safeReturnTo(returnTo) ?? ROUTES.seasons),
  })
}

export async function logout(lang: unknown) {
  // А после выхода — на лендинг: кабинет уже закрыт, показывать нечего.
  // Язык переживает выход: он свойство браузера, а не сессии.
  await signOut({ redirectTo: withLang(knownLang(lang), ROUTES.home) })
}

/**
 * Язык из кабинета: пишем и в базу, и в куку.
 *
 * Кука здесь обязательна. Она — то, чем `proxy` пользуется на пути без языка, и
 * оставить её со старым значением значило бы, что человек сменил язык, а голый
 * `/` по-прежнему уводит его на прежний. Действия — единственное место, кроме
 * `proxy`, где куку вообще можно поставить.
 */
export async function saveLanguage(value: unknown): Promise<Exclude<FamilyStatus, 'ok'>> {
  const lang = knownLang(value)
  const outcome = await writeLanguage(lang)
  if (outcome !== 'ok') return outcome

  const jar = await cookies()
  jar.set(LANG_COOKIE, lang, { path: '/', maxAge: LANG_COOKIE_MAX_AGE, sameSite: 'lax' })
  redirect(`${withLang(lang, ROUTES.account)}?ok=1`)
}

/**
 * Язык определился по браузеру, а в настройках его ещё нет — записываем.
 *
 * Это и есть «при создании нового пользователя язык определяется по региону»:
 * таблицы пользователей у нас нет, и «создание» — первая строка `user_settings`.
 * Зовёт действие клиентский `LangSync` из корневого лейаута, ровно как
 * `DraftClaimer` зовёт разбор черновика: серверный компонент писать в базу при
 * рендере не имеет права, а действие — имеет.
 */
export async function rememberLanguage(value: unknown): Promise<void> {
  await writeLanguage(knownLang(value))
}

/**
 * Ответ на баннер согласия: кука всегда, настройка аккаунта — если человек вошёл.
 *
 * Кука здесь главная, а не дублирующая: решение принимают в браузере, и у
 * невошедшего другого места нет вовсе. Ставится она отсюда, потому что действия —
 * единственное место, кроме `proxy`, где куку можно поставить; в `document.cookie`
 * проект не лезет нигде, и заводить это ради согласия незачем.
 *
 * Отказ записывается ровно так же, как согласие. «Нет» — это тоже ответ, и
 * забыть его значило бы спрашивать снова на каждой странице, то есть давить.
 *
 * Редиректа нет: баннер закрывается сам, а страницу перерисовывать не за чем —
 * `gtag` переводится в новое состояние на месте, в этом и смысл Consent Mode.
 * Молчание базы у вошедшего кукой не отменяется: в браузере ответ сохранён, а
 * в настройках его не оказалось — переспросим на следующем устройстве, и это
 * честнее, чем считать несохранённое сохранённым.
 */
export async function saveConsent(value: unknown): Promise<void> {
  const consent = consentOrNull(value)
  if (!consent) return

  const jar = await cookies()
  jar.set(CONSENT_COOKIE, consentCookieValue(consent), {
    path: '/',
    maxAge: CONSENT_COOKIE_MAX_AGE,
    sameSite: 'lax',
  })

  await writeConsent(consent)
}

/**
 * То же решение, но из кабинета: там оно пересматривается, а не даётся впервые.
 *
 * Отличий от `saveConsent` два, и оба из-за страницы. Статус нужен значением:
 * не записали — человек обязан узнать, иначе кабинет покажет новое значение
 * поверх непрочитанного. А успех уезжает пометкой `?ok=1`, как у языка и
 * состава: ему надо пережить перезагрузку.
 */
export async function saveConsentSetting(
  value: unknown,
  lang: unknown,
): Promise<Exclude<FamilyStatus, 'ok'>> {
  const consent: Consent = consentOrNull(value) ?? 'denied'
  const outcome = await writeConsent(consent)
  if (outcome !== 'ok') return outcome

  const jar = await cookies()
  jar.set(CONSENT_COOKIE, consentCookieValue(consent), {
    path: '/',
    maxAge: CONSENT_COOKIE_MAX_AGE,
    sameSite: 'lax',
  })
  redirect(`${withLang(knownLang(lang), ROUTES.account)}?ok=1`)
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
export async function saveFamily(
  family: unknown,
  lang: unknown,
): Promise<Exclude<FamilyStatus, 'ok'>> {
  const outcome = await writeFamily(normalizeFamily(family))
  if (outcome === 'ok') redirect(`${withLang(knownLang(lang), ROUTES.account)}?ok=1`)
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
    lang?: unknown
    from?: unknown
  }
  // Язык копируется вместе с бланком: форкают то, что видят на экране, а
  // подписи листа — часть увиденного.
  const lang = knownLang(raw.lang)
  const created = await createUserSeason({
    title: normalizeTitle(raw.title, posterText(lang).untitled),
    template: normalizeTemplate(raw.template),
    palette: knownPalette(raw.palette),
    iconSet: knownIconSet(raw.iconSet),
    lang,
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
export async function createSeason(title: unknown, value: unknown) {
  const lang = knownLang(value)
  const family = await readFamily()
  const template = templateForFamily(family ?? [])
  const result = await createUserSeason({
    template,
    title: normalizeTitle(title, defaultSeasonTitle(template, lang)),
    palette: DEFAULT_PALETTE,
    iconSet: DEFAULT_ICON_SET,
    lang,
  })
  if (result.status === 'ok' && result.code) redirect(seasonHref(lang, result.code, 'edit'))
  redirect(`${withLang(lang, ROUTES.seasons)}?add=${result.status}`)
}

/**
 * Автосохранение своего сезона. Зовётся дебаунсом с постера, поэтому пришедшему
 * не доверяем ровно так же, как всему остальному: бланк прогоняется через
 * `normalizeTemplate`, оформление — через свои проверки.
 */
export async function saveSeason(code: unknown, input: unknown): Promise<LibraryStatus> {
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
export async function renameSeason(
  code: unknown,
  title: unknown,
  lang: unknown,
): Promise<LibraryStatus> {
  if (typeof code !== 'string') return 'error'
  const seasonLang = knownLang(lang)
  return renameUserSeason(code, normalizeTitle(title, posterText(seasonLang).untitled), seasonLang)
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
  lang: unknown,
): Promise<{ status: PublishStatus; code?: string; fresh?: boolean }> {
  if (typeof code !== 'string') return { status: 'error' }
  return publishSeason(code, Boolean(anonymize), knownLang(lang))
}

/**
 * Чем кончится публикация, если нажать прямо сейчас. Спрашивает окно, когда
 * открывается: разговор должен начинаться с ответа, а не кончаться им.
 */
export async function previewShare(
  code: unknown,
  lang: unknown,
): Promise<{ status: PublishStatus; code?: string }> {
  if (typeof code !== 'string') return { status: 'error' }
  return previewPublish(code, knownLang(lang))
}

/** Убрать свою публикацию с витрины. Что с ней станет — решает `withdrawPublic`. */
export async function withdrawSeason(
  code: unknown,
): Promise<{ status: PublishStatus; hidden?: boolean }> {
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
export async function shareLink(
  code: unknown,
  lang: unknown,
): Promise<{ status: LibraryStatus; link?: SharedLink }> {
  if (typeof code !== 'string') return { status: 'error' }
  const result = await refreshShareToken(code)
  if (result.status !== 'ok' || !result.token) return { status: result.status }
  /*
   * Код собирается тут же, вместе с токеном: его печатает лист, а лист под
   * кнопкой никуда не уходит — перерисовывать страницу ради одного QR незачем.
   */
  return { status: 'ok', link: { token: result.token, qr: shareQr(knownLang(lang), result.token) } }
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
export async function renameEntry(code: unknown, back: unknown, title: unknown, lang: unknown) {
  const seasonLang = knownLang(lang)
  if (typeof code === 'string') {
    await renameUserSeason(code, normalizeTitle(title, posterText(seasonLang).untitled), seasonLang)
  }
  redirect(safeReturnTo(back) ?? withLang(seasonLang, ROUTES.seasons))
}

/**
 * Убрать свою публикацию с витрины **со страницы списка**. Отдельно от
 * `withdrawSeason` ровно потому, что кончается редиректом, а не значением:
 * списку надо перерисоваться и пережить перезагрузку.
 */
export async function withdrawEntry(code: unknown, back: unknown, lang: unknown) {
  if (typeof code === 'string') await withdrawPublic(code)
  redirect(safeReturnTo(back) ?? `${withLang(knownLang(lang), ROUTES.seasons)}?tab=published`)
}

/** Вернуть публикацию на витрину **со страницы списка** — та же пара, что выше. */
export async function republishEntry(code: unknown, back: unknown, lang: unknown) {
  if (typeof code === 'string') await republishPublic(code)
  redirect(safeReturnTo(back) ?? `${withLang(knownLang(lang), ROUTES.seasons)}?tab=published`)
}

/**
 * Убрать отложенное из кабинета. Отдельно от `favoriteSeason` ровно потому, что
 * кончается **редиректом**, а не значением: списку надо перерисоваться и пережить
 * перезагрузку. То же различие, что у `storeSeason` и `dropEntry`.
 */
export async function unfavoriteEntry(code: unknown, back: unknown, lang: unknown) {
  if (typeof code === 'string') await setFavorite(code, false)
  redirect(safeReturnTo(back) ?? withLang(knownLang(lang), ROUTES.seasons))
}

export async function dropEntry(code: unknown, back: unknown, lang: unknown) {
  if (typeof code === 'string') await removeUserSeason(code)
  redirect(safeReturnTo(back) ?? withLang(knownLang(lang), ROUTES.seasons))
}
