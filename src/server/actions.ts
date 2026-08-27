'use server'

import { redirect } from 'next/navigation'
import { signIn, signOut } from './auth'
import { addFavorite, removeEntry, saveSeason, seasonIdOrNull } from './library'
import { writeFamily, type FamilyStatus } from './settings'
import { normalizeFamily } from '../model/family'
import {
  normalizeTitle,
  safeSeasonUrl,
  type LibraryKind,
  type LibraryStatus,
} from '../model/library'
import { ROUTES } from '../model/site'

/**
 * Вход и выход — серверные действия, а не клиентские обработчики: так в браузер
 * не уезжает ни строчки Auth.js, и кнопка работает даже без JS.
 *
 * Лежат отдельным файлом, потому что нужны в двух местах — в шапке и на
 * «Моих сезонах».
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
 * Вход. `returnTo` собирает клиент (`GoogleLoginButton`), и это не прихоть:
 * сезон живёт в хэше, а хэш до сервера не доходит — отсюда мы вернули бы
 * человека на пустой бланк вместо листа, который он правил.
 *
 * Не назвали адрес — значит, входили из места без своего состояния, и разумное
 * умолчание тут кабинет: ради него в основном и заходят.
 */
export async function loginWithGoogle(returnTo?: unknown) {
  await signIn('google', { redirectTo: safeReturnTo(returnTo) ?? ROUTES.seasons })
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
 * Библиотека сезонов. Правила у этих действий те же, что у `saveFamily`:
 * данные едут **аргументом, а не `FormData`** (форму из клиентского компонента
 * React кодирует под своими именами), а пришедшему не доверяем — адрес и
 * название проверяются здесь, у самой записи.
 *
 * Успех и неудача расходятся так же: листу статус нужен **значением** (постер
 * никуда не уходит и терять набранное нельзя), а страница «Мои сезоны»
 * заканчивается редиректом — удаление обязано пережить перезагрузку.
 */
export async function toggleFavorite(
  url: unknown,
  title: unknown,
  existingId: unknown,
): Promise<{ status: LibraryStatus; id?: string }> {
  const id = seasonIdOrNull(existingId)
  if (id) return { status: await removeEntry('favorites', id) }

  const address = safeSeasonUrl(url)
  if (!address) return { status: 'error' }
  return addFavorite(address, normalizeTitle(title))
}

export async function storeSeason(input: unknown): Promise<{ status: LibraryStatus; id?: string }> {
  const raw = (input ?? {}) as { id?: unknown; url?: unknown; title?: unknown }
  const address = safeSeasonUrl(raw.url)
  if (!address) return { status: 'error' }
  return saveSeason({
    id: seasonIdOrNull(raw.id),
    url: address,
    title: normalizeTitle(raw.title),
  })
}

/**
 * Удаление со страницы. Вид списка и id привязаны к действию в серверном
 * компоненте, но привязанные аргументы уезжают в браузер и возвращаются оттуда —
 * поэтому проверяются наравне со всем остальным, включая адрес возврата.
 */
export async function dropEntry(kind: unknown, id: unknown, back: unknown) {
  const list: LibraryKind | null =
    kind === 'seasons' || kind === 'favorites' ? kind : null
  const key = seasonIdOrNull(id)
  if (list && key) await removeEntry(list, key)
  redirect(safeReturnTo(back) ?? ROUTES.seasons)
}
