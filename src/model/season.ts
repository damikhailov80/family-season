import { pickTargetMonth } from './calendar'
import { posterText } from './labels'
import type { Lang } from './lang'
import { pack, unpack, type Packed, type PackedPerson } from './codec'
import type { Template } from './types'

/**
 * Имена вынуты из контента не ради красоты: по контенту считается уникальность
 * публикации — сезон, у которого поменяли только имена, тот же самый, — и оттуда
 * же берётся обезличивание, подменяющее ровно `names`.
 */

export interface StoredSeason {
  /** `pack(template)` с пустыми именами. */
  content: Packed
  /** Имена по порядку `people`; длина совпадает с числом людей в контенте. */
  names: string[]
}

export function splitSeason(template: Template): StoredSeason {
  const content = pack(template)
  const names = content[7].map((person) => person[1])
  content[7] = content[7].map((person) => blankName(person))
  return { content, names }
}

/**
 * Имена вписываются до разбора, а не после: тогда их режет та же
 * `normalizeTemplate`, что и всё остальное.
 */
export function joinSeason(content: unknown, names: unknown): Template {
  const packed = (Array.isArray(content) ? [...content] : []) as Packed
  const list = Array.isArray(names) ? names : []
  const people = Array.isArray(packed[7]) ? packed[7] : []

  packed[7] = people.map((person, index) => {
    const row = blankName(person)
    row[1] = typeof list[index] === 'string' ? list[index] : ''
    return row
  })
  return unpack(packed)
}

/** Копия строки человека с пустым именем; порченую строку из базы не разбираем. */
function blankName(person: unknown): PackedPerson {
  const row = (Array.isArray(person) ? [...person] : []) as PackedPerson
  row[1] = ''
  return row
}

/**
 * Месяц «сегодняшний», а не лежащий в строке. Нужно только системным сезонам: у
 * них месяц заморожен, как у всех, и пример звал бы собирать позапрошлый год.
 */
export function withTargetMonth(template: Template): Template {
  return { ...template, theme: { ...template.theme, ...pickTargetMonth() } }
}

/**
 * Имена берутся языком сезона и без повторов: две «Ани» в одной семье читались бы
 * как ошибка, а русские имена в польском сезоне выдавали бы то, что человек прятал.
 */
export function anonymousNames(count: number, lang: Lang): string[] {
  const pool = [...posterText(lang).anonNames]
  return Array.from({ length: count }, () => {
    const index = Math.floor(Math.random() * pool.length)
    return pool.splice(index, 1)[0] ?? ''
  })
}
