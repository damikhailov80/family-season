import { test, expect } from '../fixtures'
import type { Locator, Page } from '@playwright/test'
import { DICTS } from '../../src/i18n/dict'
import { fill } from '../../src/i18n/fill'

/*
 * CLAUDE.md → "Drawings" (six avatars, a new person gets a child face the family lacks).
 *
 * Deliberately not covered: how the drawings and the person colours look (no screenshot tests;
 * the colours are held apart by `MIN_PERSON_DISTANCE` in the palette build), and the family swap
 * dialog, which copies faces from the saved family as they are.
 */

const ru = DICTS.ru

function avatars(scope: Page | Locator, aria: string) {
  return (face: string) => scope.getByRole('button', { name: fill(aria, { face }) })
}

test.describe('two children of one family do not look alike', () => {
  test('on the poster, each added child gets a face the family does not have yet', async ({
    page,
  }) => {
    await page.goto('/ru/seasons')
    await page.getByRole('button', { name: ru.seasons.newSeason }).click()
    await page.getByRole('button', { name: ru.dialogs.done }).click()
    await page.waitForURL('/ru/sheet/edit')

    const add = page.getByRole('button', { name: ru.editor.addPerson })
    await add.click()
    await add.click()
    await add.click()

    const face = avatars(page, ru.editor.faceAria)
    await expect(face('мальчик')).toHaveCount(1)
    await expect(face('девочка')).toHaveCount(1)
    await expect(face('мальчик в кепке')).toHaveCount(1)
  })

  test('in the account family, a second child is not a copy of the first', async ({
    signedIn: page,
  }) => {
    await page.goto('/ru/account')

    const add = page.getByRole('button', { name: ru.account.addPerson })
    await add.click()
    await add.click()

    const face = avatars(page, ru.account.faceAria)
    await expect(face('мальчик')).toHaveCount(1)
    await expect(face('девочка')).toHaveCount(1)
  })

  test('clicking an avatar goes through all six drawings', async ({ page }) => {
    await page.goto('/ru/seasons')
    await page.getByRole('button', { name: ru.seasons.newSeason }).click()
    await page.getByRole('button', { name: ru.dialogs.done }).click()
    await page.waitForURL('/ru/sheet/edit')

    const first = page.getByRole('button', { name: /^Рисунок: / }).first()
    for (const next of [
      'взрослая',
      'мальчик',
      'девочка',
      'мальчик в кепке',
      'девочка с хвостиком',
      'взрослый',
    ]) {
      await first.click()
      await expect(first).toHaveAccessibleName(fill(ru.editor.faceAria, { face: next }))
    }
  })
})
