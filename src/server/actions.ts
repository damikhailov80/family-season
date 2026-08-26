'use server'

import { signIn, signOut } from './auth'
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
