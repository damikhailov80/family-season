import ruDemo1 from '../data/examples/ru/demo-1.json'
import ruDemo2 from '../data/examples/ru/demo-2.json'
import ruDemo3 from '../data/examples/ru/demo-3.json'
import enDemo1 from '../data/examples/en/demo-1.json'
import enDemo2 from '../data/examples/en/demo-2.json'
import enDemo3 from '../data/examples/en/demo-3.json'
import plDemo1 from '../data/examples/pl/demo-1.json'
import plDemo2 from '../data/examples/pl/demo-2.json'
import plDemo3 from '../data/examples/pl/demo-3.json'
import type { FaceVariant, IconSetId, PaletteId } from '../types'
import { FACE_ORDER } from './accents'
import { knownIconSet } from './icons'
import { LANGS, type Lang } from './lang'
import { knownPalette } from './palettes'
import { normalizeTemplate } from './codec'
import { shortCode } from './shortcode'
import { publicSeasonHref } from './site'
import { normalizeFill } from './fill'
import type { FillState, Template } from './types'
import { EMPTY_FILL } from './types'

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
  key: string
  id: string
  lang: Lang
  publicId: number
  href: string
  name: string
  summary: string
  note: string
  template: () => Template
  fill: FillState
  faces: FaceVariant[]
  palette: PaletteId
  iconSet: IconSetId
}

const RAW: Record<Lang, Record<string, RawExample>> = {
  ru: { 'demo-1': ruDemo1, 'demo-2': ruDemo2, 'demo-3': ruDemo3 },
  en: { 'demo-1': enDemo1, 'demo-2': enDemo2, 'demo-3': enDemo3 },
  pl: { 'demo-1': plDemo1, 'demo-2': plDemo2, 'demo-3': plDemo3 },
}

const PUBLIC_IDS: Record<Lang, Record<string, number>> = {
  ru: { 'demo-1': 1, 'demo-2': 2, 'demo-3': 3 },
  en: { 'demo-1': 4, 'demo-2': 5, 'demo-3': 6 },
  pl: { 'demo-1': 7, 'demo-2': 8, 'demo-3': 9 },
}

export const DEFAULT_EXAMPLE_ID = 'demo-1'

export function exampleKey(lang: Lang, id: string): string {
  return `${lang}/${id}`
}

function facesOf(raw: RawExample): FaceVariant[] {
  const people = (raw.template as { people?: { face?: string }[] }).people ?? []
  return people
    .map((person) => person.face as FaceVariant)
    .filter((face) => FACE_ORDER.includes(face))
}

const EXAMPLES: Record<string, Example> = Object.fromEntries(
  LANGS.flatMap((lang) =>
    Object.entries(RAW[lang]).map(([id, raw]) => {
      const publicId = PUBLIC_IDS[lang][id]
      const key = exampleKey(lang, id)
      return [
        key,
        {
          key,
          id,
          lang,
          publicId,
          href: publicSeasonHref(lang, shortCode('public', publicId)),
          name: raw.name,
          summary: raw.summary,
          note: raw.note,
          template: () => normalizeTemplate(raw.template),
          fill: normalizeFill(raw.fill),
          faces: facesOf(raw),
          palette: knownPalette(raw.palette),
          iconSet: knownIconSet(raw.icons),
        } satisfies Example,
      ]
    }),
  ),
)

export function exampleByKey(key: string | null): Example | null {
  return (key && EXAMPLES[key]) ?? null
}

export function fillOf(key: string | null): FillState {
  return exampleByKey(key)?.fill ?? EMPTY_FILL
}

export const EXAMPLE_LIST: Example[] = Object.values(EXAMPLES)

export function examplesFor(lang: Lang): Example[] {
  return EXAMPLE_LIST.filter((example) => example.lang === lang)
}
