import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ICONS, ICON_VIEWBOX } from '../../src/components/doodles/icons.generated.ts'
import { shoot } from '../shot.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..', '..')

const TILE = '#336B87'
const PAPER = '#fff'
const INK = '#763626'
const RADIUS = 15
const BOX = { x: 4, y: 8.04, w: 56, h: 49.96 }

// The mark is read at two scales, and one drawing does not serve both. At 16-18px, the size
// Google draws it in search results, the roomy sheet turns the heart into a speck; the tight
// variant fills the tile with paper and the paper with the heart.
const VARIANTS = {
  full: { sheet: { x: 15, y: 9, w: 34, h: 46, r: 4 }, padding: 3.5 },
  tight: { sheet: { x: 9, y: 5, w: 46, h: 54, r: 6 }, padding: 2 },
}

const OUTPUTS = [
  { file: 'icon-16.png', size: 16, variant: 'tight' },
  { file: 'icon-32.png', size: 32, variant: 'tight' },
  { file: 'icon-48.png', size: 48, variant: 'tight' },
  { file: 'icon-192.png', size: 192, variant: 'full' },
  { file: 'apple-icon.png', size: 180, variant: 'full', radius: 0 },
  { file: 'logo-120.png', size: 120, variant: 'full' },
]

const ICO_SIZES = [16, 32, 48]

const shape = ICONS['heart']
const round = (n) => Number(n.toFixed(3))

function markSvg({ variant = 'full', radius = RADIUS } = {}) {
  const { sheet, padding } = VARIANTS[variant]
  const scale = (sheet.w - 2 * padding) / BOX.w
  const tx = round(sheet.x + sheet.w / 2 - (BOX.x + BOX.w / 2) * scale)
  const ty = round(sheet.y + sheet.h / 2 - (BOX.y + BOX.h / 2) * scale)

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ICON_VIEWBOX} ${ICON_VIEWBOX}" width="${ICON_VIEWBOX}" height="${ICON_VIEWBOX}" role="img" aria-label="Family Season">
  <!-- Built by tools/logo/build.mjs (npm run logo) from ICONS['heart']. Do not edit by hand. -->
  <rect width="${ICON_VIEWBOX}" height="${ICON_VIEWBOX}" rx="${radius}" fill="${TILE}"/>
  <rect x="${sheet.x}" y="${sheet.y}" width="${sheet.w}" height="${sheet.h}" rx="${sheet.r}" fill="${PAPER}"/>
  <g transform="translate(${tx} ${ty}) scale(${round(scale)})" fill="${INK}">
${(shape.paths ?? []).map((d) => `    <path d="${d}"/>`).join('\n')}
  </g>
</svg>
`
}

// ICO is a container: a 6-byte header, a 16-byte directory entry per image, then the payloads
// as they are. Chrome cannot write one, and a PNG inside an ICO is read by everything that
// asks for /favicon.ico today.
function ico(images) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(images.length, 4)

  let offset = 6 + images.length * 16
  const entries = images.map(({ size, png }) => {
    const entry = Buffer.alloc(16)
    entry.writeUInt8(size < 256 ? size : 0, 0)
    entry.writeUInt8(size < 256 ? size : 0, 1)
    entry.writeUInt16LE(1, 4)
    entry.writeUInt16LE(32, 6)
    entry.writeUInt32LE(png.length, 8)
    entry.writeUInt32LE(offset, 12)
    offset += png.length
    return entry
  })

  return Buffer.concat([header, ...entries, ...images.map((image) => image.png)])
}

writeFileSync(join(root, 'public', 'favicon.svg'), markSvg())

const page = (svg, size) =>
  `<style>html,body{margin:0;background:#fff}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`

for (const { file, size, variant, radius } of OUTPUTS) {
  const out = join(root, 'public', file)
  shoot(page(markSvg({ variant, radius }), size), { width: size, height: size, out })
}

const icoPath = join(root, 'public', 'favicon.ico')
writeFileSync(
  icoPath,
  ico(
    ICO_SIZES.map((size) => ({
      size,
      png: readFileSync(join(root, 'public', `icon-${size}.png`)),
    })),
  ),
)

console.log(
  `logo: public/favicon.svg, public/favicon.ico (${ICO_SIZES.join('/')}), ` +
    OUTPUTS.map((o) => `public/${o.file}`).join(', '),
)
