import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ICONS, ICON_VIEWBOX } from '../../src/components/doodles/icons.generated.ts'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..', '..')
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

const TILE = '#336B87'
const PAPER = '#fff'
const INK = '#763626'
const RADIUS = 15
const SHEET = { x: 15, y: 9, w: 34, h: 46, r: 4 }
const PADDING = 3.5
const BOX = { x: 4, y: 8.04, w: 56, h: 49.96 }
const SIZE = 120

const shape = ICONS['heart']
const scale = (SHEET.w - 2 * PADDING) / BOX.w
const round = (n) => Number(n.toFixed(3))
const tx = round(SHEET.x + SHEET.w / 2 - (BOX.x + BOX.w / 2) * scale)
const ty = round(SHEET.y + SHEET.h / 2 - (BOX.y + BOX.h / 2) * scale)

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ICON_VIEWBOX} ${ICON_VIEWBOX}" width="${ICON_VIEWBOX}" height="${ICON_VIEWBOX}" role="img" aria-label="Family Season">
  <!-- Built by tools/logo/build.mjs (npm run logo) from ICONS['heart']. Do not edit by hand. -->
  <rect width="${ICON_VIEWBOX}" height="${ICON_VIEWBOX}" rx="${RADIUS}" fill="${TILE}"/>
  <rect x="${SHEET.x}" y="${SHEET.y}" width="${SHEET.w}" height="${SHEET.h}" rx="${SHEET.r}" fill="${PAPER}"/>
  <g transform="translate(${tx} ${ty}) scale(${round(scale)})" fill="${INK}">
${(shape.paths ?? []).map((d) => `    <path d="${d}"/>`).join('\n')}
  </g>
</svg>
`

writeFileSync(join(root, 'public', 'favicon.svg'), svg)

const work = mkdtempSync(join(tmpdir(), 'logo-'))
writeFileSync(
  join(work, 'page.html'),
  `<style>html,body{margin:0;background:#fff}svg{display:block;width:${SIZE}px;height:${SIZE}px}</style>${svg}`,
)

const png = join(root, 'public', `logo-${SIZE}.png`)
execFileSync(
  CHROME,
  [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--default-background-color=ffffff',
    `--window-size=${SIZE},${SIZE}`,
    `--screenshot=${png}`,
    join(work, 'page.html'),
  ],
  { stdio: 'ignore' },
)

console.log(`logo: public/favicon.svg, public/logo-${SIZE}.png (${SIZE}×${SIZE})`)
