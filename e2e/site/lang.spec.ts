import { test, expect } from '../fixtures'
import { DICTS } from '../../src/i18n/dict'

/*
 * CLAUDE.md → «Языки».
 *
 * Сознательно не покрыто: выбор языка по `Accept-Language` на голом `/`,
 * запоминание языка кукой между заходами, язык сезона против языка интерфейса
 * на чужом выложенном постере.
 */
test.describe('смена языка', () => {
  test('переключатель уводит на тот же адрес и не теряет ни query, ни сессию', async ({
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
