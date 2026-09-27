import { test, expect } from '../fixtures'
import { DICTS } from '../../src/i18n/dict'

/*
 * CLAUDE.md → "Poster pictures of our examples".
 *
 * Deliberately not covered: how the picture looks (principle 3 - no screenshot tests), and that
 * a person's publication has no picture - it would need a publication made in the test, and the
 * rule is one `posterPages` lookup by the table of our examples' codes.
 */

// Our first example; its code is permanent, so it is written out.
const RU_EXAMPLE = '/ru/s/ydkgax'

test.describe('our examples are seen as the paper they print to', () => {
  test('every example in the map of the site has a picture of each sheet', async ({ request }) => {
    const xml = await (await request.get('/sitemap.xml')).text()
    const codes = [...xml.matchAll(/\/s\/([0-9a-z]+)<\/loc>/g)].map((match) => match[1])
    expect(codes.length).toBeGreaterThan(0)

    for (const code of codes) {
      expect((await request.head(`/posters/${code}-1.jpg`)).status(), code).toBe(200)
      expect((await request.head(`/posters/${code}-2.jpg`)).status(), code).toBe(200)
    }
  })

  test('an example is printed after it is changed, so it offers printing and no ready file', async ({
    page,
  }) => {
    await page.goto(RU_EXAMPLE)

    await expect(page.getByRole('button', { name: DICTS.ru.bars.printTitle })).toBeVisible()
    await expect(page.locator('a[download]')).toHaveCount(0)
  })

  test('a link to an example previews its own sheet', async ({ request }) => {
    const html = await (await request.get(RU_EXAMPLE)).text()

    expect(html).toContain(
      '<meta property="og:image" content="https://www.familyseason.online/posters/ydkgax-1.jpg"/>',
    )
  })

  test('a month page shows its plans as pictures that say what they are', async ({ page }) => {
    await page.goto('/ru/month/september')

    const picture = page.getByRole('img', { name: /^Месяц леса — план на месяц для семьи/ })
    await picture.scrollIntoViewIfNeeded()
    await expect(picture).toBeVisible()
    expect(await picture.evaluate((node: HTMLImageElement) => node.naturalWidth)).toBeGreaterThan(0)
  })

  test('pressing a sheet shows both sheets large and leads on to the example', async ({ page }) => {
    await page.goto('/ru/month/september')

    await page.getByRole('button', { name: /^Месяц леса — план на месяц для семьи/ }).click()

    const dialog = page.getByRole('dialog', { name: 'Месяц леса' })
    await expect(dialog.getByRole('img')).toHaveCount(2)
    await expect(
      dialog.getByRole('img', { name: 'Месяц леса — вторая страница постера' }),
    ).toBeAttached()
    await expect(dialog.getByRole('link', { name: DICTS.ru.printable.open })).toHaveAttribute(
      'href',
      /^\/ru\/s\/[0-9a-z]+$/,
    )

    await dialog.getByRole('button', { name: DICTS.ru.dialogs.close }).click()
    await expect(dialog).toBeHidden()
  })

  test('the landing page shows one of our examples as paper, next to what the site does', async ({
    page,
  }) => {
    await page.goto('/ru')

    const sheet = page.getByRole('button', { name: /— план на месяц для семьи, постер для печати/ })
    await expect(sheet).toHaveCount(1)
    await sheet.click()

    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('img')).toHaveCount(2)
    await expect(dialog.getByRole('link', { name: DICTS.ru.printable.open })).toHaveAttribute(
      'href',
      /^\/ru\/s\/[0-9a-z]+$/,
    )
  })

  test('the map of the site points the image search at the pictures', async ({ request }) => {
    const xml = await (await request.get('/sitemap.xml')).text()

    expect(xml).toContain(
      '<image:loc>https://www.familyseason.online/posters/ydkgax-2.jpg</image:loc>',
    )
  })
})
