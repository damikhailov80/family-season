import { pickTargetMonth } from './calendar'
import { posterText } from './labels'
import type { Lang } from './lang'
import { pack, unpack, type Packed, type PackedPerson } from './codec'
import type { Template } from './types'

export interface StoredSeason {
  content: Packed
  names: string[]
}

export function splitSeason(template: Template): StoredSeason {
  const content = pack(template)
  const names = content[7].map((person) => person[1])
  content[7] = content[7].map((person) => blankName(person))
  return { content, names }
}

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

function blankName(person: unknown): PackedPerson {
  const row = (Array.isArray(person) ? [...person] : []) as PackedPerson
  row[1] = ''
  return row
}

export function withTargetMonth(template: Template): Template {
  return { ...template, theme: { ...template.theme, ...pickTargetMonth() } }
}

export function anonymousNames(count: number, lang: Lang): string[] {
  const pool = [...posterText(lang).anonNames]
  return Array.from({ length: count }, () => {
    const index = Math.floor(Math.random() * pool.length)
    return pool.splice(index, 1)[0] ?? ''
  })
}
