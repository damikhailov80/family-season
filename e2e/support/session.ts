import { encode } from 'next-auth/jwt'
import type { BrowserContext } from '@playwright/test'

/**
 * Вход в тестах — подделанная кука сессии.
 *
 * Google OAuth автоматизировать нельзя, а трогать `src/server/auth.ts` ради
 * тестов не хочется вовсе: тестовый провайдер, включаемый переменной, — это
 * тестовый код в продакшен-файле входа, и однажды он окажется включённым не там.
 *
 * Подделка возможна ровно потому, что у входа **нет адаптера БД**: сессия целиком
 * лежит в зашифрованной куке (стратегия JWT), и всё, что нужно, чтобы её
 * выписать, — тот же `AUTH_SECRET`. На сервере о пользователе не остаётся ни
 * строчки, проверять подделку не с чем.
 *
 * Не исполняется при этом только колбэк `jwt` — тот, что складывает `accountKey`
 * из провайдера и идентификатора. Он в одну строку, и его форма закреплена тем,
 * что мы кладём в токен ровно такой же ключ.
 */

/** Имя куки Auth.js. Оно же — соль шифрования, так устроен `encode`. */
const COOKIE = 'authjs.session-token'

/**
 * Ключ аккаунта в тестах — `test:<что-то>`, а не `google:<id>`.
 *
 * Провайдер в ключе настоящий нигде не проверяется (это просто имя строки в
 * базе), зато по префиксу сразу видно, что строку завёл тест. Пригодится в тот
 * день, когда слепок случайно не накатится.
 */
export function testAccountKey(name: string): string {
  return `test:${name}`
}

export async function signIn(context: BrowserContext, accountKey: string): Promise<void> {
  const secret = process.env.AUTH_SECRET
  if (!secret) {
    throw new Error('Нет AUTH_SECRET — без него куку сессии не выписать (см. .env.example).')
  }

  const value = await encode({
    token: { accountKey, name: 'Тест', email: 'e2e@example.test' },
    secret,
    salt: COOKIE,
  })

  /*
   * Без префикса `__Secure-`: он нужен только на https, а тесты идут по http.
   * Auth.js сам выбирает имя по протоколу, и на localhost выберет это же.
   */
  await context.addCookies([
    { name: COOKIE, value, domain: 'localhost', path: '/', httpOnly: true, sameSite: 'Lax' },
  ])
}
