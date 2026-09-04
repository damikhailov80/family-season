import { test, expect } from '../fixtures'
import { DICTS } from '../../src/i18n/dict'

/*
 * CLAUDE.md → "Languages".
 *
 * Deliberately not covered: picking the language from `Accept-Language` on a bare
 * `/`, remembering the language in a cookie between visits, and the season's
 * language against the interface language on someone else's published poster.
 */
test.describe('switching the language', () => {
  test('the switcher goes to the same address and loses neither the query nor the session', async ({
    signedIn: page,
  }) => {
    await page.goto('/ru/seasons?tab=published')

    await expect(page.getByRole('link', { name: DICTS.ru.seasons.tabPublished })).toHaveAttribute(
      'aria-current',
      'page',
    )

    await page.getByLabel(DICTS.ru.site.langsAria).click()
    await page.getByRole('link', { name: 'English' }).click()

    await expect(page).toHaveURL('/en/seasons?tab=published')

    await expect(page.getByRole('link', { name: DICTS.en.seasons.tabPublished })).toHaveAttribute(
      'aria-current',
      'page',
    )

    await expect(page.getByRole('link', { name: DICTS.en.site.seasons })).toBeVisible()
  })
})
