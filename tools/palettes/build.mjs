/*
 * Сборка тем постера: source.json -> src/styles/palettes.css + palettes.data.ts
 * (`npm run palettes`).
 *
 * Сто наборов Canva как есть для листа не годятся: в наборе может оказаться и
 * белый, и почти чёрный. Поэтому здесь считается ровно то, чего CSS не умеет:
 * сортировка красок по светлоте (лестница «тёмная → светлая» постоянна, и
 * «глубокая» роль везде самая тёмная), цвет текста на плашке по контрасту и
 * тёмный оттенок каждой краски для рамок и заголовков.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '../..')

/** Самая светлая допустимая краска: белую плашку на белой бумаге не видно. */
const MAX_PAINT_L = 0.95
/** Тёмный оттенок: с такой светлотой краска читается текстом на белом. */
const MAX_DARK_L = 0.45
/** Ниже этого контраста белый текст на плашке нечитаем — берём чернила. */
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

/** Цвет вне sRGB гасим по цветности: светлота и тон важнее насыщенности. */
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
    // У светлой краски цветность мала: при подтемнении она выцветает в серый.
    const C = color.L > 0.7 ? color.C * 1.6 : color.C
    return hexOf({ L: MAX_DARK_L, C, h: color.h })
  })

  return { paints, onPaints, darks }
}

const source = JSON.parse(readFileSync(resolve(here, 'source.json'), 'utf8'))

// Подпись темы переводится: сборка проверяет, что ни один язык не забыт.
const LANGS = ['ru', 'en', 'pl']

for (const { id, label } of source) {
  if (!label || typeof label !== 'object') {
    throw new Error(`тема «${id}»: подпись должна быть объектом {ru, en, pl}`)
  }
  const missing = LANGS.filter((lang) => !label[lang])
  if (missing.length) throw new Error(`тема «${id}»: нет подписи на ${missing.join(', ')}`)
}

/** Подписи набраны руками, и апострофы в них бывают. */
const quote = (value) => `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`

const cssBlocks = source.map(({ id, label, colors }) => {
  const { paints, onPaints, darks } = buildPalette(colors)
  const lines = [
    ...paints.map((hex, i) => `  --c${i + 1}: ${hex};`),
    ...onPaints.map((value, i) => `  --on-c${i + 1}: ${value};`),
    ...darks.map((hex, i) => `  --d${i + 1}: ${hex};`),
  ]
  return `/* ${label.ru} */\n[data-palette='${id}'] {\n${lines.join('\n')}\n}`
})

const css = `/*
 * Краски тем постера. Файл собирается: tools/palettes/build.mjs (npm run palettes),
 * руками его не правят — правят tools/palettes/source.json и пересобирают.
 *
 * Сто наборов из подборки Canva «100 цветовых сочетаний». В наборе четыре краски,
 * отсортированные от тёмной к светлой:
 *
 *   --c1..--c4    краски набора (плашки, заливки, свотчи);
 *   --on-c1..4    цвет текста на такой плашке — белый или чернила;
 *   --d1..--d4    тёмный оттенок краски: рамки, заголовки, чернила.
 *
 * Роли («глубокий акцент», «тема месяца», «недели», «цель») раздаются в
 * src/styles/tokens.css — там же выводятся линии, подложки и чернила.
 */

${cssBlocks.join('\n\n')}
`

const ts = `/**
 * Реестр тем постера. Файл собирается: tools/palettes/build.mjs (npm run palettes),
 * руками его не правят — правят tools/palettes/source.json и пересобирают.
 *
 * Здесь только id и подписи: краски живут в src/styles/palettes.css, а логика
 * выбора темы — в src/model/palettes.ts.
 *
 * Подпись у темы на всех трёх языках сайта: её видно на кнопке переключателя.
 */

export const PALETTES = [
${source.map(({ id, label }) => `  ['${id}', { ${LANGS.map((lang) => `${lang}: ${quote(label[lang])}`).join(', ')} }],`).join('\n')}
] as const satisfies readonly (readonly [
  id: string,
  label: Readonly<Record<'ru' | 'en' | 'pl', string>>,
])[]
`

writeFileSync(resolve(root, 'src/styles/palettes.css'), css)
writeFileSync(resolve(root, 'src/model/palettes.data.ts'), ts)

console.log(`${source.length} тем: src/styles/palettes.css, src/model/palettes.data.ts`)
