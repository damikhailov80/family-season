import { test as base, type Page } from '@playwright/test'
import { signIn, testAccountKey } from './support/session'

interface Fixtures {
  signedIn: Page
}

export const test = base.extend<Fixtures>({
  signedIn: async ({ page }, use, testInfo) => {
    const accountKey = testAccountKey(`${testInfo.titlePath.join('/')}`)
    await signIn(page.context(), accountKey)
    await use(page)
  },
})

export { expect } from '@playwright/test'
