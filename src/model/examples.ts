import demo1 from '../data/examples/demo-1.json'
import demo2 from '../data/examples/demo-2.json'
import demo3 from '../data/examples/demo-3.json'
import type { FaceVariant, IconSetId, PaletteId } from '../types'
import { FACE_ORDER } from './accents'
import { knownIconSet } from './icons'
import { knownPalette } from './palettes'
import { normalizeTemplate } from './codec'
import { shortCode } from './shortcode'
import { publicSeasonHref } from './site'
import { normalizeFill } from './fill'
import type { FillState, Template } from './types'
import { EMPTY_FILL } from './types'

/**
 * Готовые примеры сезонов. Один пример — один файл `src/data/examples/<id>.json`
 * и одна строка в реестре ниже. Посев (`npm run db:seed`) кладёт их в `public_seasons`
 * системными сезонами — на витрине они такие же строки, как людские, только без автора.
 *
 * Внутри файла два слоя лежат раздельно и намеренно:
 *   template — бланк, он печатается и умещается в ссылку;
 *   fill     — заполнение (настроения, проценты, итоги, фото), на бумагу не идёт.
 *
 * `palette` и `icons` лежат рядом с ними, а не внутри бланка: тема и набор
 * рисунков — оформление постера, в ссылке их несут отдельные пометки `p=` и `i=`.
 *
 * Месяца в JSON нет: `normalizeTemplate` подставляет его от «сегодня», поэтому шаблон
 * собирается лениво, при открытии примера, а не при загрузке модуля — иначе пример
 * «протух» бы на этапе сборки статических страниц.
 */

interface RawExample {
  name: string
  summary: string
  note: string
  palette: unknown
  icons?: unknown
  template: unknown
  fill: unknown
}

export interface Example {
  id: string
  /**
   * Строка примера в `public_seasons`. Id фиксирован порядком реестра — его же
   * проставляет посев (`tools/db/seed-examples.ts`), — поэтому короткий адрес
   * считается прямо здесь и не требует похода в базу: лендинг обязан работать
   * и при мёртвой базе.
   */
  publicId: number
  /** Постоянный адрес примера: он такой же публичный сезон, как людские. */
  href: string
  /** Название примера — для карточек лендинга; в бланке его нет. */
  name: string
  summary: string
  /** Состав семьи и «прожитость» сезона одной строкой. */
  note: string
  template: () => Template
  fill: FillState
  faces: FaceVariant[]
  /** Тема, в которой показывается пример; `p=` в адресе её перебивает. */
  palette: PaletteId
  /** Набор рисунков примера; `i=` в адресе его перебивает. */
  iconSet: IconSetId
}

const RAW: Record<string, RawExample> = {
  'demo-1': demo1,
  'demo-2': demo2,
  'demo-3': demo3,
}

export const DEFAULT_EXAMPLE_ID = 'demo-1'

function facesOf(raw: RawExample): FaceVariant[] {
  const people = (raw.template as { people?: { face?: string }[] }).people ?? []
  return people
    .map((person) => person.face as FaceVariant)
    .filter((face) => FACE_ORDER.includes(face))
}

const EXAMPLES: Record<string, Example> = Object.fromEntries(
  Object.entries(RAW).map(([id, raw], index) => [
    id,
    {
      id,
      publicId: index + 1,
      href: publicSeasonHref(shortCode('public', index + 1)),
      name: raw.name,
      summary: raw.summary,
      note: raw.note,
      template: () => normalizeTemplate(raw.template),
      fill: normalizeFill(raw.fill),
      faces: facesOf(raw),
      palette: knownPalette(raw.palette),
      iconSet: knownIconSet(raw.icons),
    },
  ]),
)


export function exampleById(id: string | null): Example | null {
  return (id && EXAMPLES[id]) ?? null
}

export function fillOf(id: string | null): FillState {
  return exampleById(id)?.fill ?? EMPTY_FILL
}

/** Порядок карточек на лендинге — порядок реестра. */
export const EXAMPLE_LIST: Example[] = Object.values(EXAMPLES)
