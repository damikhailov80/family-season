/*
 * Сборка наборов рисунков: source.json -> src/components/doodles/icons.generated.ts
 * + src/model/icons.data.ts.
 *
 *   node tools/icons/build.mjs      (или npm run icons)
 *
 * В source.json лежит библиотека из сорока рисунков и двадцать наборов по восемь.
 * Слот — это место в макете постера (шапка, тема месяца, цель...), набор
 * раздаёт слотам рисунки; один и тот же рисунок может стоять в разных наборах
 * и даже в разных слотах одного набора.
 *
 * Считать здесь, в отличие от тем, нечего: геометрия рисуется руками. Зато есть
 * что проверять — и это единственная причина, по которой сборка вообще нужна:
 *
 *   — у каждого набора ровно те слоты, что объявлены в `slots`, без пропусков;
 *   — все имена рисунков в наборах существуют в библиотеке;
 *   — ни один рисунок библиотеки не остался неиспользованным (принцип 6);
 *   — id рисунков и наборов не повторяются.
 *
 * Проглядеть такое руками в двадцати наборах нельзя, а цена ошибки — пустое
 * место на постере вместо рисунка.
 *
 * Все рисунки живут на одной квадратной сетке `0 0 64 64`: слот задаёт размер,
 * и рисунок обязан вставать в чужое место без правки вёрстки. Обводка общая
 * (2.3), но мелким слотам она не годится — у таких рисунков своя `stroke`
 * и заливка (`fill`), иначе в 18 px от них остаётся серая паутина.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '../..')

/** Сетка рисунка. Одна на всю библиотеку — см. шапку файла. */
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

const used = new Set()
const ids = new Set()
for (const set of sets) {
  if (ids.has(set.id)) fail(`набор «${set.id}» объявлен дважды`)
  ids.add(set.id)
  if (!set.label) fail(`у набора «${set.id}» нет подписи`)
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
  if (icon.paths) fields.push(`paths: [\n      ${icon.paths.map((d) => `'${d}'`).join(',\n      ')},\n    ]`)
  return `  '${icon.name}': {\n    ${fields.join(',\n    ')},\n  },`
})

const geometry = `/**
 * Библиотека рисунков постера. Файл собирается: tools/icons/build.mjs (npm run icons),
 * руками его не правят — правят tools/icons/source.json и пересобирают.
 *
 * Все рисунки лежат на одной сетке ${VIEWBOX}×${VIEWBOX}: слот в макете задаёт размер,
 * и любой рисунок обязан вставать в чужое место, не меняя пропорций.
 *
 * Рисует их \`Icon.tsx\`, раздаёт слотам \`PosterIcon.tsx\`, а какой рисунок в каком
 * слоте — в наборах (src/model/icons.data.ts).
 */

export const ICON_VIEWBOX = ${VIEWBOX}

/** Общая обводка. Мелкие рисунки перебивают её своей — им нужна жирнее. */
export const ICON_STROKE = 2.3

export interface IconShape {
  /** Рисунок залит краской, а не только обведён: мелким без заливки не выжить. */
  fill?: boolean
  /** Своя толщина обводки вместо общей. */
  stroke?: number
  /** Круги: [cx, cy, r]. Отдельно от путей — так их проще читать и держать в сетке. */
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
  return `  ['${id}', '${label}', { ${pairs} }],`
})

const registry = `/**
 * Реестр наборов рисунков. Файл собирается: tools/icons/build.mjs (npm run icons),
 * руками его не правят — правят tools/icons/source.json и пересобирают.
 *
 * Здесь id, подписи и раздача рисунков по слотам; сама геометрия —
 * в src/components/doodles/icons.generated.ts, а логика выбора — в src/model/icons.ts.
 */

import type { IconName } from '../components/doodles/icons.generated'

/** Места в макете постера. Порядок — порядок слотов в source.json. */
export const ICON_SLOTS = ${list(slots.map((slot) => `'${slot}'`))} as const

export const ICON_SETS = [
${rows.join('\n')}
] as const satisfies readonly (readonly [
  id: string,
  label: string,
  slots: Readonly<Record<(typeof ICON_SLOTS)[number], IconName>>,
])[]
`

writeFileSync(resolve(root, 'src/components/doodles/icons.generated.ts'), geometry)
writeFileSync(resolve(root, 'src/model/icons.data.ts'), registry)

console.log(
  `${icons.length} рисунков, ${sets.length} наборов: ` +
    'src/components/doodles/icons.generated.ts, src/model/icons.data.ts',
)
