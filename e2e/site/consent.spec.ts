import { test, expect } from '../fixtures'
import type { Page } from '@playwright/test'
import { DICTS } from '../../src/i18n/dict'

/*
 * CLAUDE.md → «Согласие и аналитика».
 *
 * Сознательно не покрыто: смена `CONSENT_VERSION`, поведение без `GA_ID`
 * (переменная стоит на весь прогон) и то, что уходит в сам Google.
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

test.beforeEach(async ({ context }) => {
  await context.route('**/googletagmanager.com/**', (route) => route.abort())
})

test.describe('согласие на аналитику', () => {
  test('до ответа аналитика выключена, а «Принять» включает её без перезагрузки', async ({
    page,
  }) => {
    await page.goto('/ru')

    const banner = page.getByRole('region', { name: DICTS.ru.consent.bannerAria })
    await expect(banner).toBeVisible()

    expect(await analyticsStorage(page)).toBe('denied')

    await banner.getByRole('button', { name: DICTS.ru.consent.accept }).click()

    await expect(banner).toBeHidden()
    expect(await analyticsStorage(page)).toBe('granted')

    await page.reload()
    await expect(page.getByRole('region', { name: DICTS.ru.consent.bannerAria })).toBeHidden()
    expect(await analyticsStorage(page)).toBe('granted')
  })

  test('отказ запоминается так же, как согласие', async ({ page }) => {
    await page.goto('/ru')

    const banner = page.getByRole('region', { name: DICTS.ru.consent.bannerAria })
    await banner.getByRole('button', { name: DICTS.ru.consent.decline }).click()
    await expect(banner).toBeHidden()

    await page.reload()

    await expect(page.getByRole('region', { name: DICTS.ru.consent.bannerAria })).toBeHidden()
    expect(await analyticsStorage(page)).toBe('denied')
  })

  test('ссылка «Куки» в подвале открывает разговор заново', async ({ page }) => {
    await page.goto('/ru')

    const banner = page.getByRole('region', { name: DICTS.ru.consent.bannerAria })
    await banner.getByRole('button', { name: DICTS.ru.consent.decline }).click()
    await expect(banner).toBeHidden()

    await page.getByRole('button', { name: DICTS.ru.site.cookies }).click()
    await expect(banner).toBeVisible()

    await banner.getByRole('button', { name: DICTS.ru.consent.accept }).click()
    expect(await analyticsStorage(page)).toBe('granted')
  })

  test('решение вошедшего лежит в настройках аккаунта и переживает чистую куку', async ({
    signedIn: page,
  }) => {
    await page.goto('/ru')

    const banner = page.getByRole('region', { name: DICTS.ru.consent.bannerAria })
    await banner.getByRole('button', { name: DICTS.ru.consent.accept }).click()
    await expect(banner).toBeHidden()

    await page.context().clearCookies({ name: 'fs-consent' })
    await page.goto('/ru')

    await expect(page.getByRole('region', { name: DICTS.ru.consent.bannerAria })).toBeHidden()
    expect(await analyticsStorage(page)).toBe('granted')

    await page.goto('/ru/account')
    await expect(page.getByLabel(DICTS.ru.consent.label)).toHaveValue('granted')
  })
})
