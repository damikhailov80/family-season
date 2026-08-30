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

/**
 * Готовые примеры сезонов. Один пример — один файл
 * `src/data/examples/<язык>/<id>.json` и одна строка в реестре ниже. Посев
 * (`npm run db:seed`) кладёт их в `public_seasons` системными сезонами — на
 * витрине они такие же строки, как людские, только без автора.
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
 *
 * Языков у примера три, и это три **разные строки витрины**, а не один сезон с
 * тремя подписями: содержимое переведено целиком, включая слой заполнения, и
 * витрина показывает свой язык (см. «Языки» в CLAUDE.md). Фотографии недель при
 * этом общие — в них нет ни слова.
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
  /** `ru/demo-1` — язык и файл. Он же лежит в колонке `fill_id` строки посева. */
  key: string
  /** `demo-1` — сам пример, общий у трёх языков. */
  id: string
  /** Язык этого перевода: и содержимого листа, и карточки на лендинге. */
  lang: Lang
  /**
   * Строка примера в `public_seasons`. Id фиксирован таблицей `PUBLIC_IDS`, а
   * не порядком реестра: короткий адрес — перестановка id, он обещан
   * постоянным, и появление нового языка не имеет права сдвинуть выданные коды.
   * Его же проставляет посев (`tools/db/seed-examples.ts`), поэтому короткий
   * адрес считается прямо здесь и не требует похода в базу: лендинг обязан
   * работать и при мёртвой базе.
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

const RAW: Record<Lang, Record<string, RawExample>> = {
  ru: { 'demo-1': ruDemo1, 'demo-2': ruDemo2, 'demo-3': ruDemo3 },
  en: { 'demo-1': enDemo1, 'demo-2': enDemo2, 'demo-3': enDemo3 },
  pl: { 'demo-1': plDemo1, 'demo-2': plDemo2, 'demo-3': plDemo3 },
}

/**
 * Номера строк в `public_seasons`. Русские сохранили 1–3 — те, что были выданы
 * до появления языков, — а новые языки получили свои блоки. Числа проставлены
 * руками и меняться не могут: из них считается короткий адрес.
 */
const PUBLIC_IDS: Record<Lang, Record<string, number>> = {
  ru: { 'demo-1': 1, 'demo-2': 2, 'demo-3': 3 },
  en: { 'demo-1': 4, 'demo-2': 5, 'demo-3': 6 },
  pl: { 'demo-1': 7, 'demo-2': 8, 'demo-3': 9 },
}

export const DEFAULT_EXAMPLE_ID = 'demo-1'

/** `ru/demo-1` — то, что лежит в колонке `fill_id`. */
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

/** Пример по ключу `ru/demo-1`. Неизвестный ключ — как будто примера нет. */
export function exampleByKey(key: string | null): Example | null {
  return (key && EXAMPLES[key]) ?? null
}

export function fillOf(key: string | null): FillState {
  return exampleByKey(key)?.fill ?? EMPTY_FILL
}

/** Все примеры подряд — их читает только посев. */
export const EXAMPLE_LIST: Example[] = Object.values(EXAMPLES)

/** Карточки лендинга: свои три, в порядке реестра. */
export function examplesFor(lang: Lang): Example[] {
  return EXAMPLE_LIST.filter((example) => example.lang === lang)
}
