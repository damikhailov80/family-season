'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { signIn, signOut } from './auth'
import { shareQr } from './qr'
import {
  readFamily,
  writeConsent,
  writeFamily,
  writeLanguage,
  type FamilyStatus,
  type SaveFamilyStatus,
} from './settings'
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
import { familyNamed, normalizeFamily, templateForFamily } from '../model/family'
import { DEFAULT_ICON_SET, knownIconSet } from '../model/icons'
import { knownLang, LANG_COOKIE, LANG_COOKIE_MAX_AGE } from '../model/lang'
import { posterText } from '../model/labels'
import { defaultSeasonTitle, normalizeTitle, type LibraryStatus } from '../model/library'
import type { SharedLink } from '../model/qr'
import { DEFAULT_PALETTE, knownPalette } from '../model/palettes'
import { ROUTES, seasonHref, stripLang, withLang } from '../model/site'

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
 * Действие отдаёт адрес, а не уводит по нему: `redirect()` на чужой origin идёт
 * через роутер Next, тот просит у `accounts.google.com` RSC-ответ, ловит отказ
 * CORS и только потом откатывается к обычному переходу — с «Failed to fetch RSC
 * payload» в консоли на каждый вход. Уводит поэтому браузер (`location.href` в
 * `GoogleLoginButton`); куки `state` и PKCE от этого не страдают, их кладёт сам
 * `signIn` через `cookies()`.
 */
export async function googleLoginUrl(returnTo?: unknown): Promise<string> {
  /*
   * Возвращаемся на ту же страницу, но без языка в адресе: язык в пути `proxy`
   * считает выбором человека и настройке из базы уступает. Отдаём голый путь —
   * `proxy` подставит язык сам, пометит `auto`, и настройка победит.
   */
  return signIn('google', {
    redirect: false,
    redirectTo: stripLang(safeReturnTo(returnTo) ?? ROUTES.seasons),
  })
}

export async function logout(lang: unknown) {
  // Язык переживает выход: он свойство браузера, а не сессии.
  await signOut({ redirectTo: withLang(knownLang(lang), ROUTES.home) })
}

/**
 * Кука здесь обязательна: ею `proxy` пользуется на пути без языка, и оставить её
 * со старым значением значило бы, что человек сменил язык, а голый `/`
 * по-прежнему уводит его на прежний.
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
 * Язык определился по браузеру, а в настройках его ещё нет — записываем. Зовёт
 * клиентский `LangSync`: серверный компонент писать в базу при рендере не имеет
 * права, а действие — имеет.
 */
export async function rememberLanguage(value: unknown): Promise<void> {
  await writeLanguage(knownLang(value))
}

/**
 * Кука здесь главная, а не дублирующая: решение принимают в браузере, и у
 * невошедшего другого места нет вовсе. Отказ записывается так же, как согласие:
 * забыть «нет» значило бы спрашивать снова на каждой странице.
 *
 * Редиректа нет — `gtag` переводится в новое состояние на месте, в этом и смысл
 * Consent Mode. Молчание базы кукой не отменяется: переспросим на следующем
 * устройстве, это честнее, чем считать несохранённое сохранённым.
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
 * То же решение из кабинета. Отличий от `saveConsent` два, и оба из-за страницы:
 * статус нужен значением (не записали — человек обязан узнать), а успех уезжает
 * пометкой `?ok=1`, как у языка и состава, — ему надо пережить перезагрузку.
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
 * Состав приходит аргументом, а не `FormData`: форму из клиентского компонента
 * React кодирует под своими именами (`_1_name`, …), и разбор по `getAll('name')`
 * молча возвращал бы пустоту.
 *
 * Успех уезжает пометкой в адрес — ему надо пережить перезагрузку. Неудача
 * возвращается значением: редирект перерисовал бы кабинет с нуля, а набранного
 * состава у сервера нет — он молча пропал бы, и повторять было бы нечего.
 */
export async function saveFamily(family: unknown, lang: unknown): Promise<SaveFamilyStatus> {
  const people = normalizeFamily(family)
  if (!familyNamed(people)) return 'unnamed'

  const outcome = await writeFamily(people)
  if (outcome === 'ok') redirect(`${withLang(knownLang(lang), ROUTES.account)}?ok=1`)
  return outcome
}

/**
 * Завести сезон из того, что сейчас на экране. Форк — копия, а не ссылка, и
 * повторный форк — просто ещё одна строка.
 *
 * `from` — код выложенного сезона, с которого форкнули: он нужен только
 * статистике автора и на саму строку не влияет.
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
  // Язык копируется вместе с бланком: подписи листа — часть увиденного.
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
 * «Новый сезон» для вошедшего: строка заводится сразу, состав семьи из кабинета
 * подставляется здесь же — постеру про базу знать по-прежнему нечего. Пустое имя
 * не отказ, а умолчание: его подставит `normalizeTitle`.
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
 * Отдельно от `renameEntry` потому, что кончается значением, а не редиректом:
 * постер под панелью никуда не уходит, перерисовывать страницу незачем.
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
 * Уезжает код своего сезона, а не бланк: копию сервер снимет сам, из собственной
 * строки. Иначе на витрину можно было бы положить что угодно.
 */
export async function shareSeason(
  code: unknown,
  anonymize: unknown,
  lang: unknown,
): Promise<{ status: PublishStatus; code?: string; fresh?: boolean }> {
  if (typeof code !== 'string') return { status: 'error' }
  return publishSeason(code, Boolean(anonymize), knownLang(lang))
}

export async function previewShare(
  code: unknown,
  lang: unknown,
): Promise<{ status: PublishStatus; code?: string }> {
  if (typeof code !== 'string') return { status: 'error' }
  return previewPublish(code, knownLang(lang))
}

export async function withdrawSeason(
  code: unknown,
): Promise<{ status: PublishStatus; hidden?: boolean }> {
  if (typeof code !== 'string') return { status: 'error' }
  return withdrawPublic(code)
}

export async function republishSeason(code: unknown): Promise<PublishStatus> {
  if (typeof code !== 'string') return 'error'
  return republishPublic(code)
}

/** Выдать (или заменить) приватную ссылку и отозвать её. */
export async function shareLink(
  code: unknown,
  lang: unknown,
): Promise<{ status: LibraryStatus; link?: SharedLink }> {
  if (typeof code !== 'string') return { status: 'error' }
  const result = await refreshShareToken(code)
  if (result.status !== 'ok' || !result.token) return { status: result.status }
  // Код собирается вместе с токеном: переспрашивать сервер после его же ответа незачем.
  return { status: 'ok', link: { token: result.token, qr: shareQr(knownLang(lang), result.token) } }
}

export async function revokeLink(code: unknown): Promise<LibraryStatus> {
  if (typeof code !== 'string') return 'error'
  return dropShareToken(code)
}

/**
 * Желаемое состояние приходит от клиента, а не «переключи там сам»: так запрос к
 * базе один и идемпотентен (см. `setLike`).
 */
export async function likeSeason(code: unknown, on: unknown): Promise<ReactionStatus> {
  if (typeof code !== 'string') return 'error'
  return setLike(code, Boolean(on))
}

export async function favoriteSeason(code: unknown, on: unknown): Promise<ReactionStatus> {
  if (typeof code !== 'string') return 'error'
  return setFavorite(code, Boolean(on))
}

/** Без комментария не принимаем: жалоба без слов бесполезна тому, кто её разбирает. */
export async function reportSeason(code: unknown, comment: unknown): Promise<ReactionStatus> {
  const text = normalizeComment(comment)
  if (typeof code !== 'string' || !text) return 'error'
  return addReport(code, text)
}

/**
 * Действия со страницы списка кончаются редиректом, а не значением: списку надо
 * перерисоваться и пережить перезагрузку. Привязанные аргументы уезжают в браузер
 * и возвращаются оттуда, поэтому проверяются наравне со всем остальным.
 */
export async function renameEntry(code: unknown, back: unknown, title: unknown, lang: unknown) {
  const seasonLang = knownLang(lang)
  if (typeof code === 'string') {
    await renameUserSeason(code, normalizeTitle(title, posterText(seasonLang).untitled), seasonLang)
  }
  redirect(safeReturnTo(back) ?? withLang(seasonLang, ROUTES.seasons))
}

export async function withdrawEntry(code: unknown, back: unknown, lang: unknown) {
  if (typeof code === 'string') await withdrawPublic(code)
  redirect(safeReturnTo(back) ?? `${withLang(knownLang(lang), ROUTES.seasons)}?tab=published`)
}

export async function republishEntry(code: unknown, back: unknown, lang: unknown) {
  if (typeof code === 'string') await republishPublic(code)
  redirect(safeReturnTo(back) ?? `${withLang(knownLang(lang), ROUTES.seasons)}?tab=published`)
}

export async function unfavoriteEntry(code: unknown, back: unknown, lang: unknown) {
  if (typeof code === 'string') await setFavorite(code, false)
  redirect(safeReturnTo(back) ?? withLang(knownLang(lang), ROUTES.seasons))
}

export async function dropEntry(code: unknown, back: unknown, lang: unknown) {
  if (typeof code === 'string') await removeUserSeason(code)
  redirect(safeReturnTo(back) ?? withLang(knownLang(lang), ROUTES.seasons))
}
