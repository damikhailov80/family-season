import { encode } from 'next-auth/jwt'
import type { BrowserContext } from '@playwright/test'

const COOKIE = 'authjs.session-token'

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

  await context.addCookies([
    { name: COOKIE, value, domain: 'localhost', path: '/', httpOnly: true, sameSite: 'Lax' },
  ])
}
