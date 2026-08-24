import demo1 from '../data/examples/demo-1.json'
import demo2 from '../data/examples/demo-2.json'
import demo3 from '../data/examples/demo-3.json'
import type { FaceVariant } from '../types'
import { FACE_ORDER } from './accents'
import { normalizeTemplate } from './codec'
import { normalizeFill } from './fill'
import type { FillState, Template } from './types'
import { EMPTY_FILL } from './types'

/**
 * Готовые примеры сезонов. Один пример — один файл `src/data/examples/<id>.json`
 * и одна строка в реестре ниже; в ссылке от примера едет только его id (`data=demo-1`).
 *
 * Внутри файла два слоя лежат раздельно и намеренно:
 *   template — бланк, он печатается и умещается в ссылку;
 *   fill     — заполнение (настроения, проценты, итоги, фото), на бумагу не идёт.
 *
 * Месяца в JSON нет: `normalizeTemplate` подставляет его от «сегодня», поэтому шаблон
 * собирается лениво, при открытии примера, а не при загрузке модуля — иначе пример
 * «протух» бы на этапе сборки статических страниц.
 */

interface RawExample {
  name: string
  summary: string
  note: string
  template: unknown
  fill: unknown
}

export interface Example {
  id: string
  /** Название примера — для карточек лендинга; в бланке его нет. */
  name: string
  summary: string
  /** Состав семьи и «прожитость» сезона одной строкой. */
  note: string
  template: () => Template
  fill: FillState
  faces: FaceVariant[]
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
  Object.entries(RAW).map(([id, raw]) => [
    id,
    {
      id,
      name: raw.name,
      summary: raw.summary,
      note: raw.note,
      template: () => normalizeTemplate(raw.template),
      fill: normalizeFill(raw.fill),
      faces: facesOf(raw),
    },
  ]),
)

/** id из адреса мог написать кто угодно: неизвестный — как будто его нет. */
export function knownExampleId(id: string | null | undefined): string | null {
  return id && id in EXAMPLES ? id : null
}

export function exampleById(id: string | null): Example | null {
  return (id && EXAMPLES[id]) ?? null
}

export function fillOf(id: string | null): FillState {
  return exampleById(id)?.fill ?? EMPTY_FILL
}

/** Порядок карточек на лендинге — порядок реестра. */
export const EXAMPLE_LIST: Example[] = Object.values(EXAMPLES)
