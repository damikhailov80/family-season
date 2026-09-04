import { encode } from 'next-auth/jwt'
import type { BrowserContext } from '@playwright/test'

const COOKIE = 'authjs.session-token'

export function testAccountKey(name: string): string {
  return `test:${name}`
}

export async function signIn(context: BrowserContext, accountKey: string): Promise<void> {
  const secret = process.env.AUTH_SECRET
  if (!secret) {
    throw new Error(
      'No AUTH_SECRET — the session cookie cannot be issued without it (see .env.example).',
    )
  }

  const value = await encode({
    token: { accountKey, name: 'Test', email: 'e2e@example.test' },
    secret,
    salt: COOKIE,
  })

  await context.addCookies([
    { name: COOKIE, value, domain: 'localhost', path: '/', httpOnly: true, sameSite: 'Lax' },
  ])
}
