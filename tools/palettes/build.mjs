import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '../..')

const MAX_PAINT_L = 0.95
const MAX_DARK_L = 0.45
const MIN_WHITE_CONTRAST = 4

const toLinear = (v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
const toGamma = (v) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055)

function parseHex(hex) {
  const n = Number.parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => v / 255)
}

function toHex(rgb) {
  return (
    '#' +
    rgb
      .map((v) =>
        Math.round(Math.min(1, Math.max(0, v)) * 255)
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')
      .toUpperCase()
  )
}

function rgbToOklch([r, g, b]) {
  const lr = toLinear(r)
  const lg = toLinear(g)
  const lb = toLinear(b)
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb)
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb)
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb)
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  const C = Math.hypot(a, bb)
  const h = C < 1e-6 ? 0 : ((Math.atan2(bb, a) * 180) / Math.PI + 360) % 360
  return { L, C, h }
}

function oklchToRgb({ L, C, h }) {
  const a = C * Math.cos((h * Math.PI) / 180)
  const b = C * Math.sin((h * Math.PI) / 180)
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [
    toGamma(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    toGamma(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    toGamma(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ]
}

const inGamut = (rgb) => rgb.every((v) => v >= -0.001 && v <= 1.001)

function toRgbInGamut(color) {
  if (inGamut(oklchToRgb(color))) return oklchToRgb(color)
  let lo = 0
  let hi = color.C
  for (let i = 0; i < 24; i += 1) {
    const mid = (lo + hi) / 2
    if (inGamut(oklchToRgb({ ...color, C: mid }))) lo = mid
    else hi = mid
  }
  return oklchToRgb({ ...color, C: lo })
}

const hexOf = (color) => toHex(toRgbInGamut(color))

function luminance([r, g, b]) {
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
}

function contrastWithWhite(rgb) {
  return 1.05 / (luminance(rgb) + 0.05)
}

function buildPalette(colors) {
  const sorted = colors
    .map((hex) => ({ hex, ...rgbToOklch(parseHex(hex)) }))
    .sort((a, b) => a.L - b.L)

  const paints = sorted.map((color) =>
    color.L <= MAX_PAINT_L ? color.hex : hexOf({ ...color, L: MAX_PAINT_L }),
  )

  const onPaints = paints.map((hex) =>
    contrastWithWhite(parseHex(hex)) >= MIN_WHITE_CONTRAST ? '#fff' : 'var(--ink)',
  )

  const darks = sorted.map((color) => {
    if (color.L <= MAX_DARK_L) return color.hex
    const C = color.L > 0.7 ? color.C * 1.6 : color.C
    return hexOf({ L: MAX_DARK_L, C, h: color.h })
  })

  return { paints, onPaints, darks }
}

const source = JSON.parse(readFileSync(resolve(here, 'source.json'), 'utf8'))

const LANGS = ['ru', 'en', 'pl']

for (const { id, label } of source) {
  if (!label || typeof label !== 'object') {
    throw new Error(`palette "${id}": the label must be an object {ru, en, pl}`)
  }
  const missing = LANGS.filter((lang) => !label[lang])
  if (missing.length) throw new Error(`palette "${id}": no label in ${missing.join(', ')}`)
}

const quote = (value) => `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`

const cssBlocks = source.map(({ id, label, colors }) => {
  const { paints, onPaints, darks } = buildPalette(colors)
  const lines = [
    ...paints.map((hex, i) => `  --c${i + 1}: ${hex};`),
    ...onPaints.map((value, i) => `  --on-c${i + 1}: ${value};`),
    ...darks.map((hex, i) => `  --d${i + 1}: ${hex};`),
  ]
  return `/* ${label.en} */\n[data-palette='${id}'] {\n${lines.join('\n')}\n}`
})

const css = `/* Built by tools/palettes/build.mjs (npm run palettes) from tools/palettes/source.json. */

${cssBlocks.join('\n\n')}
`

const ts = `/* Built by tools/palettes/build.mjs (npm run palettes) from tools/palettes/source.json. */

export const PALETTES = [
${source.map(({ id, label }) => `  ['${id}', { ${LANGS.map((lang) => `${lang}: ${quote(label[lang])}`).join(', ')} }],`).join('\n')}
] as const satisfies readonly (readonly [
  id: string,
  label: Readonly<Record<'ru' | 'en' | 'pl', string>>,
])[]
`

writeFileSync(resolve(root, 'src/styles/palettes.css'), css)
writeFileSync(resolve(root, 'src/model/palettes.data.ts'), ts)

console.log(`${source.length} palettes: src/styles/palettes.css, src/model/palettes.data.ts`)
