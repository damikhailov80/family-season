import { test, expect } from '../fixtures'
import type { Page } from '@playwright/test'
import { DICTS } from '../../src/i18n/dict'

/*
 * CLAUDE.md → "Consent and analytics".
 *
 * Deliberately not covered: a change of `CONSENT_VERSION`, the behaviour without
 * `GA_ID` (the variable is set for the whole run) and what goes to Google itself.
 */
async function analyticsStorage(page: Page): Promise<string> {
  return page.evaluate(() => {
    const layer: unknown[] = (window as unknown as { dataLayer?: unknown[] }).dataLayer ?? []
    let value = 'unset'
    for (const entry of layer) {
      const call = entry as Record<number, unknown>
      if (call[0] !== 'consent') continue
      const params = call[2] as Record<string, string> | undefined
      if (params && 'analytics_storage' in params) value = params.analytics_storage
    }
    return value
  })
}

// The banner hides at once and saves the answer in the background (a server action sets the
// cookie in its response). A reload before that response aborts the request, so a test that
// reloads waits for it first - a person does not reload within the same hundred milliseconds.
// Other server actions run on the same page (LangSync on load), so the request is told apart by
// the answer it carries.
async function answer(page: Page, button: string, value: string): Promise<void> {
  const saved = page.waitForResponse((response) => {
    const request = response.request()
    return (
      Boolean(request.headers()['next-action']) && (request.postData() ?? '').includes(`"${value}"`)
    )
  })
  await page
    .getByRole('region', { name: DICTS.ru.consent.bannerAria })
    .getByRole('button', { name: button })
    .click()
  await saved
}

test.beforeEach(async ({ context }) => {
  await context.route('**/googletagmanager.com/**', (route) => route.abort())
})

test.describe('consent to analytics', () => {
  test('analytics is off until the answer, and "Accept" turns it on without a reload', async ({
    page,
  }) => {
    await page.goto('/ru')

    const banner = page.getByRole('region', { name: DICTS.ru.consent.bannerAria })
    await expect(banner).toBeVisible()

    expect(await analyticsStorage(page)).toBe('denied')

    await answer(page, DICTS.ru.consent.accept, 'granted')

    await expect(banner).toBeHidden()
    expect(await analyticsStorage(page)).toBe('granted')

    await page.reload()
    await expect(page.getByRole('region', { name: DICTS.ru.consent.bannerAria })).toBeHidden()
    expect(await analyticsStorage(page)).toBe('granted')
  })

  test('a refusal is remembered the same way as consent', async ({ page }) => {
    await page.goto('/ru')

    const banner = page.getByRole('region', { name: DICTS.ru.consent.bannerAria })
    await answer(page, DICTS.ru.consent.decline, 'denied')
    await expect(banner).toBeHidden()

    await page.reload()

    await expect(page.getByRole('region', { name: DICTS.ru.consent.bannerAria })).toBeHidden()
    expect(await analyticsStorage(page)).toBe('denied')
  })

  test('the "Cookies" link in the footer opens the conversation again', async ({ page }) => {
    await page.goto('/ru')

    const banner = page.getByRole('region', { name: DICTS.ru.consent.bannerAria })
    await banner.getByRole('button', { name: DICTS.ru.consent.decline }).click()
    await expect(banner).toBeHidden()

    await page.getByRole('button', { name: DICTS.ru.site.cookies }).click()
    await expect(banner).toBeVisible()

    await banner.getByRole('button', { name: DICTS.ru.consent.accept }).click()
    expect(await analyticsStorage(page)).toBe('granted')
  })

  test('a signed-in decision lives in the account settings and survives a cleared cookie', async ({
    signedIn: page,
  }) => {
    await page.goto('/ru')

    const banner = page.getByRole('region', { name: DICTS.ru.consent.bannerAria })
    await answer(page, DICTS.ru.consent.accept, 'granted')
    await expect(banner).toBeHidden()

    await page.context().clearCookies({ name: 'fs-consent' })
    await page.goto('/ru')

    await expect(page.getByRole('region', { name: DICTS.ru.consent.bannerAria })).toBeHidden()
    expect(await analyticsStorage(page)).toBe('granted')

    await page.goto('/ru/account')
    await expect(page.getByLabel(DICTS.ru.consent.label)).toHaveValue('granted')
  })
})
