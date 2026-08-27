'use server'

import { redirect } from 'next/navigation'
import { signIn, signOut } from './auth'
import { writeFamily } from './settings'
import { normalizeFamily } from '../model/family'
import { ROUTES } from '../model/site'

/**
 * Вход и выход — серверные действия, а не клиентские обработчики: так в браузер
 * не уезжает ни строчки Auth.js, и кнопка работает даже без JS.
 *
 * Лежат отдельным файлом, потому что нужны в двух местах — в шапке и на
 * «Моих сезонах».
 */

export async function loginWithGoogle() {
  // После входа — сразу в кабинет: ради него в него и заходят.
  await signIn('google', { redirectTo: ROUTES.seasons })
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
 * Результат сообщаем пометкой в адресе, а не возвращаемым значением: так
 * «Сохранено» переживает перезагрузку и не требует `useActionState`.
 */
export async function saveFamily(family: unknown) {
  const outcome = await writeFamily(normalizeFamily(family))
  redirect(`${ROUTES.account}?${outcome}=1`)
}
