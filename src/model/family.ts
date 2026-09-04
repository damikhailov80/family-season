import type { FaceVariant } from '../types'
import { FACE_ORDER } from './accents'
import { limitFor } from './limits'
import { MAX_PEOPLE, MIN_PEOPLE } from './types'
import { createEmptyTemplate, createPerson } from './templates'
import type { Template } from './types'

/**
 * Не часть бланка: в `Template` едет уже собранный список людей, а здесь лежит
 * только «кого ставить по умолчанию».
 */
export interface FamilyMember {
  face: FaceVariant
  name: string
}

export type FamilyPreset = FamilyMember[]

/** Ровно то, что даёт `createEmptyTemplate`: без настройки ничего не меняется. */
export const DEFAULT_FAMILY: FamilyPreset = [
  { face: 'dad', name: '' },
  { face: 'mom', name: '' },
]

/** Тот же, что у имени на постере: иначе настройка собрала бы обрезаемый бланк. */
export const NAME_LIMIT = limitFor('people.0.name')

function member(input: unknown, fallback: FaceVariant): FamilyMember | null {
  // Старый формат — просто список лиц; такие строки в базе есть, и терять их нельзя.
  if (typeof input === 'string') {
    return FACE_ORDER.includes(input as FaceVariant)
      ? { face: input as FaceVariant, name: '' }
      : null
  }
  if (!input || typeof input !== 'object') return null
  const raw = input as { face?: unknown; name?: unknown }
  const face = FACE_ORDER.includes(raw.face as FaceVariant) ? (raw.face as FaceVariant) : fallback
  const name = typeof raw.name === 'string' ? raw.name.replace(/\s+/g, ' ').trim() : ''
  return { face, name: name.slice(0, NAME_LIMIT) }
}

/** Границы те же, что у постера: `MIN_PEOPLE`..`MAX_PEOPLE`. */
export function normalizeFamily(input: unknown): FamilyPreset {
  const list = Array.isArray(input) ? input : []
  const people: FamilyPreset = []
  for (const item of list) {
    if (people.length >= MAX_PEOPLE) break
    const parsed = member(item, FACE_ORDER[people.length % FACE_ORDER.length])
    if (parsed) people.push(parsed)
  }
  while (people.length < MIN_PEOPLE) people.push({ ...DEFAULT_FAMILY[people.length] })
  return people
}

/**
 * Правило живёт здесь, а не в `normalizeFamily`: та читает и старые строки базы,
 * и `DEFAULT_FAMILY`, где имён нет вовсе. Пустое имя запрещено ровно при записи
 * из кабинета; самому бланку это не указ.
 */
export function familyNamed(family: FamilyPreset): boolean {
  return family.every((person) => person.name.trim() !== '')
}

/** От настройки едут только лица и имена. */
export function templateForFamily(family: FamilyPreset): Template {
  const template = createEmptyTemplate()
  return {
    ...template,
    people: normalizeFamily(family).map((person, index) => ({
      ...createPerson(`p${index + 1}`, person.face),
      name: person.name,
    })),
  }
}
