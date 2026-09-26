import { test, expect } from '../fixtures'
import type { Page } from '@playwright/test'
import { DICTS } from '../../src/i18n/dict'

/*
 * CLAUDE.md → "The month" and "The showcase: publishing" (uniqueness counts the month).
 *
 * Deliberately not covered: the private link `/p/<token>` (it reads the same row as the own
 * season, with no substitution on the way), and the fork of your own season (the same
 * `withCurrentMonth` as the fork button on foreign posters).
 */

const ru = DICTS.ru

// Our "Month of Firsts" example, written out: a short code is permanent.
const RU_EXAMPLE = '/ru/s/ydkgax'

// The month heading keeps a hidden spacer with the longest month name, which in Russian is
// September itself - so only the visible text counts.
function shownMonth(page: Page, name: string) {
  return page
    .getByRole('region', { name: ru.poster.labels.theme })
    .getByText(name, { exact: true })
    .filter({ visible: true })
}

async function newSeason(page: Page, subtitle: string) {
  await page.goto('/ru/seasons')
  await page.getByRole('button', { name: ru.seasons.newSeason }).click()
  await page.getByRole('button', { name: ru.dialogs.done }).click()
  await page.waitForURL(/\/ru\/season\/\w+\/edit$/)
  const field = page.getByRole('textbox', { name: ru.poster.placeholders.subtitle })
  await field.click()
  await field.pressSequentially(subtitle)
  await field.press('Enter')
}

async function stepMonth(page: Page, times: number) {
  for (let i = 0; i < times; i += 1) {
    await page.getByRole('button', { name: ru.editor.nextMonth }).click()
  }
}

async function openPublish(page: Page) {
  await page.getByRole('link', { name: ru.bars.ready }).click()
  await page.waitForURL(/\/ru\/season\/\w+$/)
  await page.getByRole('button', { name: ru.bars.publish }).click()
  return page.getByRole('dialog', { name: ru.dialogs.publish })
}

test.describe('a season shows the month it was saved with', () => {
  test('an example opened from the September page is September', async ({ page }) => {
    await page.goto('/ru/month/september')
    await page.getByRole('link', { name: 'Месяц леса' }).first().click()

    await expect(shownMonth(page, 'Сентябрь')).toHaveCount(1)
  })

  test('a draft keeps its month when the calendar moves on', async ({ page }) => {
    await page.clock.setFixedTime(new Date('2027-03-05T12:00:00'))
    await page.goto('/ru/seasons')
    await page.getByRole('button', { name: ru.seasons.newSeason }).click()
    await page.getByRole('button', { name: ru.dialogs.done }).click()
    await page.waitForURL('/ru/sheet/edit')

    await page.clock.setFixedTime(new Date('2027-08-20T12:00:00'))
    await page.goto('/ru/sheet')

    await expect(shownMonth(page, 'Март')).toHaveCount(1)
  })
})

test.describe('a new season and a fork take the current month', () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.setFixedTime(new Date('2027-03-05T12:00:00'))
  })

  test('a new draft is this month', async ({ page }) => {
    await page.goto('/ru/seasons')
    await page.getByRole('button', { name: ru.seasons.newSeason }).click()
    await page.getByRole('button', { name: ru.dialogs.done }).click()
    await page.waitForURL('/ru/sheet/edit')

    await expect(shownMonth(page, 'Март')).toHaveCount(1)
  })

  test('a fork of an October example is this month, name included', async ({ page }) => {
    await page.goto(RU_EXAMPLE)
    await expect(shownMonth(page, 'Октябрь')).toHaveCount(1)

    await page.getByRole('button', { name: ru.dialogs.forkAction }).click()
    await expect(page.getByLabel(ru.dialogs.titleLabel)).toHaveValue(/^Март 2027, /)
    await page.getByRole('button', { name: ru.dialogs.done }).click()
    await page.waitForURL('/ru/sheet/edit')

    await expect(shownMonth(page, 'Март')).toHaveCount(1)
  })
})

test.describe('the showcase tells ideas apart by month, not by year', () => {
  test('the same idea in another month is not a duplicate, in another year it is', async ({
    signedIn: page,
  }) => {
    const subtitle = `Месяц ${Date.now().toString(36)}`

    await newSeason(page, subtitle)
    let dialog = await openPublish(page)
    await dialog.getByRole('button', { name: ru.dialogs.publishAction }).click()
    await page.waitForURL(/\/ru\/s\/\w+$/)

    await newSeason(page, subtitle)
    await stepMonth(page, 12)
    dialog = await openPublish(page)
    await expect(dialog.getByRole('link', { name: ru.dialogs.publishSeeIt })).toBeVisible()

    await newSeason(page, subtitle)
    await stepMonth(page, 1)
    dialog = await openPublish(page)
    await expect(dialog.getByRole('button', { name: ru.dialogs.publishAction })).toBeEnabled()
  })
})
