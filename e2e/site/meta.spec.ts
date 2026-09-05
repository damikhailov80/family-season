import { test, expect } from '../fixtures'
import { DICTS } from '../../src/i18n/dict'

/*
 * CLAUDE.md → "Link previews and icons".
 *
 * Deliberately not covered: how the drawings themselves look (that is principle 3 — there
 * are no screenshot tests in the project), the preview inside a real messenger (visible only
 * on the live domain), and `/p/<token>`, which needs a season and an issued link — the rule
 * there is the same `pageMeta({ index: false })` as on `/sheet` and `/seasons`.
 */

const content = (html: string, pattern: RegExp) => html.match(pattern)?.[1]

// A short code is a permutation of the row id and is promised to be permanent, so the address
// of our first example is written out rather than computed: a test that recomputes the answer
// with the function under test asserts nothing.
const RU_EXAMPLE = '/ru/s/ydkgax'

test.describe('the site says what it is to a crawler', () => {
  test('the icon is served as a picture, not as a page', async ({ request }) => {
    const response = await request.get('/favicon.ico')

    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).not.toContain('text/html')
  })

  test('an address that is not a language is not the landing page', async ({ request }) => {
    expect((await request.get('/nope.png')).status()).toBe(404)
    expect((await request.get('/de/ideas')).status()).toBe(404)
  })

  test('a link to the site carries a preview', async ({ request }) => {
    const html = await (await request.get('/ru')).text()

    expect(content(html, /property="og:title" content="([^"]+)"/)).toBe(DICTS.ru.landing.title)
    expect(content(html, /property="og:image" content="([^"]+)"/)).toBe(
      'https://www.familyseason.online/og-ru.png',
    )
    expect(content(html, /property="og:site_name" content="([^"]+)"/)).toBe(DICTS.ru.site.brand)
    expect(content(html, /name="twitter:card" content="([^"]+)"/)).toBe('summary_large_image')
  })

  test('a page knows its own address and its translations', async ({ request }) => {
    const html = await (await request.get('/ru/ideas')).text()

    expect(content(html, /rel="canonical" href="([^"]+)"/)).toBe(
      'https://www.familyseason.online/ru/ideas',
    )
    expect(html).toContain('hrefLang="en" href="https://www.familyseason.online/en/ideas"')
    expect(html).toContain('hrefLang="pl" href="https://www.familyseason.online/pl/ideas"')
    expect(html).toContain('hrefLang="x-default" href="https://www.familyseason.online/ru/ideas"')
  })

  test('a personal page stays out of the index but keeps its preview', async ({ request }) => {
    const html = await (await request.get('/ru/seasons')).text()

    expect(content(html, /name="robots" content="([^"]+)"/)).toContain('noindex')
    expect(html).not.toContain('rel="canonical"')
    expect(content(html, /property="og:image" content="([^"]+)"/)).toBe(
      'https://www.familyseason.online/og-ru.png',
    )
  })

  test('the map of the site lists the three languages of every open page', async ({ request }) => {
    const xml = await (await request.get('/sitemap.xml')).text()

    expect(xml).toContain('<loc>https://www.familyseason.online/ru/ideas</loc>')
    expect(xml).toContain('<loc>https://www.familyseason.online/en/ideas</loc>')
    expect(xml).toContain('<loc>https://www.familyseason.online/pl/ideas</loc>')
    expect(xml).not.toContain('/seasons')
  })

  test('the map of the site lists our examples, and only in their own language', async ({
    request,
  }) => {
    const xml = await (await request.get('/sitemap.xml')).text()

    expect(xml).toContain(`<loc>https://www.familyseason.online${RU_EXAMPLE}</loc>`)
    expect(xml).toContain('<loc>https://www.familyseason.online/pl/s/tab14z</loc>')
    expect(xml).not.toContain('https://www.familyseason.online/en/s/ydkgax')
  })

  test('a personal page is closed to a crawler together with its language', async ({ request }) => {
    const txt = await (await request.get('/robots.txt')).text()

    expect(txt).toContain('Disallow: /*/seasons')
    expect(txt).toContain('Disallow: /*/account')
    expect(txt).toContain('Disallow: /*/sheet')
    expect(txt).toContain('Disallow: /*/p/')
    expect(txt).toContain('Disallow: /*/season/')
  })

  test('the landing page names itself an application, not a television season', async ({
    request,
  }) => {
    const html = await (await request.get('/ru')).text()
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)].map(
      (found) => JSON.parse(found[1]),
    )

    const graph = blocks.flatMap((block) => block['@graph'] ?? [block])
    const app = graph.find((node) => node['@type'] === 'WebApplication')
    const site = graph.find((node) => node['@type'] === 'WebSite')

    expect(app.applicationCategory).toBe('LifestyleApplication')
    expect(app.isAccessibleForFree).toBe(true)
    expect(app.offers.price).toBe('0')
    expect(site.alternateName).toBe(DICTS.ru.site.alternateName)
  })

  test('a publication describes itself, not publications in general', async ({ request }) => {
    const html = await (await request.get(RU_EXAMPLE)).text()

    const description = content(html, /name="description" content="([^"]+)"/)!
    expect(description).not.toBe(DICTS.ru.pages.publicDescription)
    expect(description.startsWith('План месяца для семьи: ')).toBe(true)
    expect(content(html, /<title>([^<]+)<\/title>/)).toContain('план месяца | Семейный сезон')
  })
})

test.describe('a month has a page of its own', () => {
  test('the month page answers the question people actually type', async ({ page }) => {
    await page.goto('/ru/month/september')

    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Чем заняться с семьёй в сентябре',
    )
    await expect(page.getByRole('heading', { level: 2 })).not.toHaveCount(0)
  })

  test('a month we have not written about is not a page', async ({ request }) => {
    expect((await request.get('/ru/month/april')).status()).toBe(404)
    expect((await request.get('/ru/month/nope')).status()).toBe(404)
  })

  test('the month page opens in all three languages and knows its translations', async ({
    request,
  }) => {
    const html = await (await request.get('/en/month/september')).text()

    expect(content(html, /rel="canonical" href="([^"]+)"/)).toBe(
      'https://www.familyseason.online/en/month/september',
    )
    expect(html).toContain(
      'hrefLang="pl" href="https://www.familyseason.online/pl/month/september"',
    )
    expect((await request.get('/pl/month/september')).status()).toBe(200)
  })

  test('a month page is reachable by walking the site, not only by knowing its address', async ({
    page,
  }) => {
    await page.goto('/ru')
    await page
      .getByRole('navigation', { name: DICTS.ru.site.navAria })
      .getByRole('link', {
        name: DICTS.ru.site.months,
      })
      .click()

    await expect(page).toHaveURL('/ru/month')
    await page.getByRole('link', { name: 'Сентябрь', exact: false }).first().click()
    await expect(page).toHaveURL('/ru/month/september')
  })

  test('the map of the site lists the month pages', async ({ request }) => {
    const xml = await (await request.get('/sitemap.xml')).text()

    expect(xml).toContain('<loc>https://www.familyseason.online/ru/month</loc>')
    expect(xml).toContain('<loc>https://www.familyseason.online/ru/month/september</loc>')
    expect(xml).toContain('<loc>https://www.familyseason.online/pl/month/september</loc>')
  })
})

test.describe('the page has a readable outline', () => {
  test('the landing page is headed by what the site is, not only by its name', async ({ page }) => {
    await page.goto('/ru')

    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toHaveCount(1)
    await expect(h1).toContainText(DICTS.ru.landing.heroTitle)
    await expect(h1).toContainText(DICTS.ru.landing.heroTitleTail)
    await expect(page.getByRole('heading', { level: 2 })).not.toHaveCount(0)
  })

  test('the showcase has a heading of its own', async ({ page }) => {
    await page.goto('/ru/ideas')

    await expect(page.getByRole('heading', { level: 1 })).toHaveText(DICTS.ru.ideas.heading)
  })
})
