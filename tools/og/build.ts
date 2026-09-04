import { join } from 'node:path'
import { DICTS } from '../../src/i18n/dict'
import { LANGS } from '../../src/model/lang'
import { shoot } from '../shot.mjs'

const root = join(import.meta.dirname, '..', '..')

const WIDTH = 1200
const HEIGHT = 630

const TILE = '#336B87'
const INK = '#763626'

const FONTS =
  'https://fonts.googleapis.com/css2?family=Caveat:wght@700&family=Nunito:wght@400;700&display=block'

// The fonts are inlined rather than linked: a linked face loads asynchronously, and a
// screenshot taken a moment early would silently come out in a system font. Cyrillic and
// latin-ext travel along with everything else - the css2 answer keeps its unicode-range
// blocks, so the browser still picks the subset it needs.
async function inlineFonts(): Promise<string> {
  const css = await fetch(FONTS, {
    headers: {
      'user-agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
    },
  }).then((response) => response.text())

  const urls = [...new Set([...css.matchAll(/url\((https:\/\/[^)]+\.woff2)\)/g)].map((m) => m[1]))]
  const files = await Promise.all(
    urls.map(async (url) => {
      const bytes = await fetch(url).then((response) => response.arrayBuffer())
      return [url, `data:font/woff2;base64,${Buffer.from(bytes).toString('base64')}`] as const
    }),
  )

  return files.reduce((text, [url, data]) => text.replaceAll(url, data), css)
}

const mark = `<svg viewBox="0 0 64 64" width="132" height="132" aria-hidden="true">
      <rect width="64" height="64" rx="15" fill="${TILE}"/>
      <rect x="15" y="9" width="34" height="46" rx="4" fill="#fff"/>
      <g transform="translate(16.571 16.08) scale(0.482)" fill="${INK}">
        <path d="M32 58C13 42 4 31 4 20 4 10 15 5 23 10c4 3 8 6 9 12 1-6 5-9 9-12 8-5 19 0 19 10 0 10-9 22-28 38Z"/>
      </g>
    </svg>`

function page(fonts: string, brand: string, description: string): string {
  return `<meta charset="utf-8">
<style>
${fonts}
html, body { margin: 0; background: #fff }
.card {
  box-sizing: border-box;
  width: ${WIDTH}px; height: ${HEIGHT}px;
  padding: 74px 86px;
  border: 10px solid ${TILE};
  display: flex; flex-direction: column; justify-content: center; gap: 34px;
  font-family: 'Nunito', system-ui, sans-serif;
}
.brand { display: flex; align-items: center; gap: 30px }
.name { font-family: 'Caveat', cursive; font-weight: 700; font-size: 92px; line-height: 1; white-space: nowrap; color: ${TILE} }
.text { font-size: 40px; line-height: 1.35; color: #3d3d3d }
.weeks { display: flex; gap: 22px; margin-top: 8px }
.week { flex: 1; height: 74px; border: 3px solid ${TILE}; border-radius: 12px; opacity: 0.35 }
</style>
<div class="card">
  <div class="brand">
    ${mark}
    <div class="name">${brand}</div>
  </div>
  <div class="text">${description}</div>
  <div class="weeks"><i class="week"></i><i class="week"></i><i class="week"></i><i class="week"></i></div>
</div>
`
}

const fonts = await inlineFonts()

for (const lang of LANGS) {
  const { site } = DICTS[lang]
  const out = join(root, 'public', `og-${lang}.png`)
  shoot(page(fonts, site.brand, site.description), { width: WIDTH, height: HEIGHT, out })
  console.log(`og: public/og-${lang}.png (${WIDTH}×${HEIGHT})`)
}
