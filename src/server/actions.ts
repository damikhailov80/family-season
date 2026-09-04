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

function safeReturnTo(value: unknown): string | null {
  if (typeof value !== 'string') return null
  if (!value.startsWith('/') || value.startsWith('//')) return null
  return value
}

export async function googleLoginUrl(returnTo?: unknown): Promise<string> {
  return signIn('google', {
    redirect: false,
    redirectTo: stripLang(safeReturnTo(returnTo) ?? ROUTES.seasons),
  })
}

export async function logout(lang: unknown) {
  await signOut({ redirectTo: withLang(knownLang(lang), ROUTES.home) })
}

export async function saveLanguage(value: unknown): Promise<Exclude<FamilyStatus, 'ok'>> {
  const lang = knownLang(value)
  const outcome = await writeLanguage(lang)
  if (outcome !== 'ok') return outcome

  const jar = await cookies()
  jar.set(LANG_COOKIE, lang, { path: '/', maxAge: LANG_COOKIE_MAX_AGE, sameSite: 'lax' })
  redirect(`${withLang(lang, ROUTES.account)}?ok=1`)
}

export async function rememberLanguage(value: unknown): Promise<void> {
  await writeLanguage(knownLang(value))
}

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

export async function saveFamily(family: unknown, lang: unknown): Promise<SaveFamilyStatus> {
  const people = normalizeFamily(family)
  if (!familyNamed(people)) return 'unnamed'

  const outcome = await writeFamily(people)
  if (outcome === 'ok') redirect(`${withLang(knownLang(lang), ROUTES.account)}?ok=1`)
  return outcome
}

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

export async function renameSeason(
  code: unknown,
  title: unknown,
  lang: unknown,
): Promise<LibraryStatus> {
  if (typeof code !== 'string') return 'error'
  const seasonLang = knownLang(lang)
  return renameUserSeason(code, normalizeTitle(title, posterText(seasonLang).untitled), seasonLang)
}

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

export async function shareLink(
  code: unknown,
  lang: unknown,
): Promise<{ status: LibraryStatus; link?: SharedLink }> {
  if (typeof code !== 'string') return { status: 'error' }
  const result = await refreshShareToken(code)
  if (result.status !== 'ok' || !result.token) return { status: result.status }
  return { status: 'ok', link: { token: result.token, qr: shareQr(knownLang(lang), result.token) } }
}

export async function revokeLink(code: unknown): Promise<LibraryStatus> {
  if (typeof code !== 'string') return 'error'
  return dropShareToken(code)
}

export async function likeSeason(code: unknown, on: unknown): Promise<ReactionStatus> {
  if (typeof code !== 'string') return 'error'
  return setLike(code, Boolean(on))
}

export async function favoriteSeason(code: unknown, on: unknown): Promise<ReactionStatus> {
  if (typeof code !== 'string') return 'error'
  return setFavorite(code, Boolean(on))
}

export async function reportSeason(code: unknown, comment: unknown): Promise<ReactionStatus> {
  const text = normalizeComment(comment)
  if (typeof code !== 'string' || !text) return 'error'
  return addReport(code, text)
}

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
