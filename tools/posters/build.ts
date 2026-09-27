import { spawn } from 'node:child_process'
import { mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from '@playwright/test'
import { EXAMPLE_LIST } from '../../src/model/examples'
import { POSTER_MARGIN, POSTER_PAGE, POSTER_SCALE, posterPages } from '../../src/model/posters'
import { shortCode } from '../../src/model/shortcode'

const root = join(import.meta.dirname, '..', '..')
const out = join(root, 'public', 'posters')

// The examples live in the database, so the shots are taken from the real poster served by the
// built app. It is pointed at the e2e database, rebuilt from the same example files a moment ago
// by `npm run posters` - `next start` alone would pick up .env.production.local and the working
// database. A port of its own, so a test server left on 3100 is not mistaken for this one.
const PORT = 3101
const BASE = `http://localhost:${PORT}`

process.loadEnvFile(join(root, '.env.local'))
const database = process.env.E2E_DATABASE_URL
if (!database) throw new Error('E2E_DATABASE_URL is not set in .env.local')

// A group of its own, so that stopping it stops the workers `next start` forks as well.
const server = spawn(
  join(root, 'node_modules', '.bin', 'next'),
  ['start', '--port', String(PORT)],
  {
    cwd: root,
    env: { ...process.env, DATABASE_URL: database, AUTH_TRUST_HOST: 'true', AUTH_URL: BASE },
    stdio: 'ignore',
    detached: true,
  },
)

// The picture is the printed sheet as it looks at the end of the month: the print layout, with the
// fill layer written in. Print media would hide that layer, so the print rules are applied as
// ordinary styles instead - all but `display: none`, which in the poster's print rules hides only
// the fill layer and the edit controls (not drawn in viewing anyway). The on-screen max-width
// queries are switched off, as the print rules expect the desktop layout under them (the recipe
// in CLAUDE.md, "Printing: two A4 pages"). Everything outside the poster - the site frame, whose
// print rule was one of those skipped, the bar, the floating buttons, the consent banner - is made
// invisible, so that nothing but the sheet falls into the shot.
function printedWithFill(margin: number) {
  const rules: string[] = []
  for (const sheet of Array.from(document.styleSheets)) {
    for (const rule of Array.from(sheet.cssRules)) {
      if (!(rule instanceof CSSMediaRule)) continue
      if (rule.media.mediaText === 'print') {
        for (const inner of Array.from(rule.cssRules)) {
          if (inner instanceof CSSStyleRule && inner.style.display === 'none') continue
          rules.push(inner.cssText)
        }
      } else if (rule.media.mediaText.includes('max-width')) {
        rule.media.mediaText = 'not all'
      }
    }
  }
  rules.push(`#root { padding: ${margin}px; }`)
  const style = document.createElement('style')
  style.textContent = rules.join('\n')
  document.head.append(style)

  const poster = document.querySelector('[data-palette]:has(header)')!
  for (const node of Array.from(document.querySelectorAll<HTMLElement>('body *'))) {
    if (!node.contains(poster) && !poster.contains(node)) node.style.visibility = 'hidden'
  }
}

async function ready() {
  for (let attempt = 0; attempt < 60; attempt++) {
    const answer = await fetch(`${BASE}/ru`).catch(() => null)
    if (answer?.ok) return
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  throw new Error(`the app did not answer on ${BASE}`)
}

try {
  await ready()
  rmSync(out, { recursive: true, force: true })
  mkdirSync(out, { recursive: true })

  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: {
      width: POSTER_PAGE.width + 2 * POSTER_MARGIN,
      height: 2 * (POSTER_PAGE.height + 2 * POSTER_MARGIN) + 400,
    },
    deviceScaleFactor: POSTER_SCALE,
  })
  const page = await context.newPage()

  for (const example of EXAMPLE_LIST) {
    const code = shortCode('public', example.publicId)
    const files = posterPages(code)!

    await page.goto(`${BASE}${example.href}`, { waitUntil: 'networkidle' })
    await page.evaluate(() => document.fonts.ready)
    await page.evaluate(printedWithFill, POSTER_MARGIN)

    const sheets = page.locator('[data-palette]:has(header) > div')
    if ((await sheets.count()) !== files.length) {
      throw new Error(`${example.key}: the poster does not have ${files.length} sheets`)
    }

    for (const [index, file] of files.entries()) {
      await page.evaluate((shown) => {
        const all = document.querySelectorAll<HTMLElement>('[data-palette]:has(header) > div')
        all.forEach((sheet, at) => (sheet.style.visibility = at === shown ? '' : 'hidden'))
      }, index)

      const box = (await sheets.nth(index).boundingBox())!
      if (box.height > POSTER_PAGE.height) {
        throw new Error(`${example.key}: sheet ${index + 1} is ${box.height}px, over POSTER_PAGE`)
      }
      await page.screenshot({
        path: join(root, 'public', file),
        type: 'jpeg',
        quality: 82,
        fullPage: true,
        clip: {
          x: box.x - POSTER_MARGIN,
          y: box.y - POSTER_MARGIN,
          width: POSTER_PAGE.width + 2 * POSTER_MARGIN,
          height: POSTER_PAGE.height + 2 * POSTER_MARGIN,
        },
      })
    }

    console.log(`${example.key} → ${files.join(', ')}`)
  }

  await browser.close()
} finally {
  process.kill(-server.pid!)
}
