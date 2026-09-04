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
})
