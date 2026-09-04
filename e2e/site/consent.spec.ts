import { test, expect } from '../fixtures'
import type { Page } from '@playwright/test'
import { DICTS } from '../../src/i18n/dict'

/**
 * Согласие на аналитику. CLAUDE.md → «Согласие и аналитика».
 *
 * Проверяется то, из-за чего механизм и заведён: **пока человек не ответил
 * «Принять», аналитика выключена**, ответ запоминается, а передумать можно в
 * любой момент. Всё это — обязанности из GDPR, а не удобства, и молча
 * разъехаться с кодом они не имеют права.
 *
 * Запросы к Google глушим `page.route`: тесты не должны ходить наружу, а
 * идентификатор в `playwright.config.ts` и так ненастоящий.
 *
 * Сознательно не покрыто (ждёт своих тестов):
 *   - смена `CONSENT_VERSION`: баннер обязан выйти снова к тем, кто отвечал на
 *     прежнюю версию вопроса;
 *   - поведение без `GA_ID` — там не рисуется ничего, и проверять нечем:
 *     переменная стоит на весь прогон;
 *   - что именно уходит в сам Google: это его дело, а не наше.
 */

/** Итоговый режим хранения, как его видит `gtag`: последнее слово в очереди. */
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

    // Главное утверждение: счётчик загружен, но ничего не хранит.
    expect(await analyticsStorage(page)).toBe('denied')

    await banner.getByRole('button', { name: DICTS.ru.consent.accept }).click()

    await expect(banner).toBeHidden()
    // Именно на месте: в этом и смысл Consent Mode — перезагрузка не нужна.
    expect(await analyticsStorage(page)).toBe('granted')

    // …и ответ пережил перезагрузку.
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

    // «Нет» — тоже ответ: спрашивать снова на каждой странице значило бы давить.
    await expect(page.getByRole('region', { name: DICTS.ru.consent.bannerAria })).toBeHidden()
    expect(await analyticsStorage(page)).toBe('denied')
  })

  test('ссылка «Куки» в подвале открывает разговор заново', async ({ page }) => {
    await page.goto('/ru')

    const banner = page.getByRole('region', { name: DICTS.ru.consent.bannerAria })
    await banner.getByRole('button', { name: DICTS.ru.consent.decline }).click()
    await expect(banner).toBeHidden()

    // Единственный способ передумать для невошедшего: кабинета у него нет.
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

    // Кука — ответ **этого браузера**. Убираем только её: сессия остаётся, и
    // ответ теперь взять неоткуда, кроме настроек аккаунта.
    await page.context().clearCookies({ name: 'fs-consent' })
    await page.goto('/ru')

    await expect(page.getByRole('region', { name: DICTS.ru.consent.bannerAria })).toBeHidden()
    expect(await analyticsStorage(page)).toBe('granted')

    // То же решение видно и в кабинете — там его и пересматривают.
    await page.goto('/ru/account')
    await expect(page.getByLabel(DICTS.ru.consent.label)).toHaveValue('granted')
  })
})
