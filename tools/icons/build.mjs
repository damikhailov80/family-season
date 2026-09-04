import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '../..')

const VIEWBOX = 64

const fail = (message) => {
  console.error(`tools/icons/build.mjs: ${message}`)
  process.exit(1)
}

const source = JSON.parse(readFileSync(resolve(here, 'source.json'), 'utf8'))
const { slots, icons, sets } = source

if (!Array.isArray(slots) || slots.length === 0) fail('в source.json нет списка слотов')

const names = new Set()
for (const icon of icons) {
  if (names.has(icon.name)) fail(`рисунок «${icon.name}» объявлен дважды`)
  names.add(icon.name)
  const circles = icon.circles ?? []
  const paths = icon.paths ?? []
  if (circles.length + paths.length === 0) fail(`у рисунка «${icon.name}» нет геометрии`)
  for (const [cx, cy, r] of circles) {
    if (cx - r < 0 || cy - r < 0 || cx + r > VIEWBOX || cy + r > VIEWBOX) {
      fail(`рисунок «${icon.name}»: круг вылезает за сетку ${VIEWBOX}×${VIEWBOX}`)
    }
  }
}

const LANGS = ['ru', 'en', 'pl']

const used = new Set()
const ids = new Set()
for (const set of sets) {
  if (ids.has(set.id)) fail(`набор «${set.id}» объявлен дважды`)
  ids.add(set.id)
  if (!set.label || typeof set.label !== 'object') {
    fail(`у набора «${set.id}» подпись должна быть объектом {ru, en, pl}`)
  }
  const noLabel = LANGS.filter((lang) => !set.label[lang])
  if (noLabel.length) fail(`у набора «${set.id}» нет подписи на ${noLabel.join(', ')}`)
  const keys = Object.keys(set.slots)
  const extra = keys.filter((slot) => !slots.includes(slot))
  const missing = slots.filter((slot) => !keys.includes(slot))
  if (extra.length) fail(`у набора «${set.id}» лишние слоты: ${extra.join(', ')}`)
  if (missing.length) fail(`у набора «${set.id}» нет слотов: ${missing.join(', ')}`)
  for (const slot of slots) {
    const name = set.slots[slot]
    if (!names.has(name)) fail(`набор «${set.id}», слот «${slot}»: нет рисунка «${name}»`)
    used.add(name)
  }
}

const orphans = [...names].filter((name) => !used.has(name))
if (orphans.length) fail(`рисунки не вошли ни в один набор: ${orphans.join(', ')}`)

const list = (values) => `[${values.join(', ')}]`

const shapes = icons.map((icon) => {
  const fields = []
  if (icon.fill) fields.push('fill: true')
  if (icon.stroke) fields.push(`stroke: ${icon.stroke}`)
  if (icon.circles) fields.push(`circles: ${list(icon.circles.map((c) => list(c)))}`)
  if (icon.paths)
    fields.push(`paths: [\n      ${icon.paths.map((d) => `'${d}'`).join(',\n      ')},\n    ]`)
  return `  '${icon.name}': {\n    ${fields.join(',\n    ')},\n  },`
})

const geometry = `/* Собирается tools/icons/build.mjs (npm run icons) из tools/icons/source.json. */

export const ICON_VIEWBOX = ${VIEWBOX}

export const ICON_STROKE = 2.3

export interface IconShape {
  fill?: boolean
  stroke?: number
  circles?: readonly (readonly number[])[]
  paths?: readonly string[]
}

export const ICONS = {
${shapes.join('\n')}
} satisfies Record<string, IconShape>

export type IconName = keyof typeof ICONS
`

const rows = sets.map(({ id, label, slots: map }) => {
  const pairs = slots.map((slot) => `${slot}: '${map[slot]}'`).join(', ')
  const caption = LANGS.map((lang) => `${lang}: '${label[lang].replace(/'/g, "\\'")}'`).join(', ')
  return `  ['${id}', { ${caption} }, { ${pairs} }],`
})

const registry = `/* Собирается tools/icons/build.mjs (npm run icons) из tools/icons/source.json. */

import type { IconName } from '../components/doodles/icons.generated'

export const ICON_SLOTS = ${list(slots.map((slot) => `'${slot}'`))} as const

export const ICON_SETS = [
${rows.join('\n')}
] as const satisfies readonly (readonly [
  id: string,
  label: Readonly<Record<'ru' | 'en' | 'pl', string>>,
  slots: Readonly<Record<(typeof ICON_SLOTS)[number], IconName>>,
])[]
`

writeFileSync(resolve(root, 'src/components/doodles/icons.generated.ts'), geometry)
writeFileSync(resolve(root, 'src/model/icons.data.ts'), registry)

console.log(
  `${icons.length} рисунков, ${sets.length} наборов: ` +
    'src/components/doodles/icons.generated.ts, src/model/icons.data.ts',
)
