import type { FaceVariant } from '../types'
import { FACE_ORDER } from './accents'
import { limitFor } from './limits'
import { MAX_PEOPLE, MIN_PEOPLE } from './types'
import { createEmptyTemplate, createPerson } from './templates'
import type { Template } from './types'

/**
 * Состав семьи для новых постеров — единственная настройка, которой нужна память.
 * Это не часть бланка: в `Template` едет уже собранный список людей, а здесь
 * лежит только «кого ставить по умолчанию».
 *
 * Файл намеренно без серверных зависимостей: им пользуется и страница кабинета,
 * и шапка, и запись в базу.
 */
export interface FamilyMember {
  face: FaceVariant
  name: string
}

export type FamilyPreset = FamilyMember[]

/** Ровно то, что даёт `createEmptyTemplate` сегодня, — поведение без настройки не меняется. */
export const DEFAULT_FAMILY: FamilyPreset = [
  { face: 'dad', name: '' },
  { face: 'mom', name: '' },
]

/**
 * Предел имени — тот же, что у имени на постере. Иначе настройка собрала бы
 * бланк, который сам постер не принял бы и молча обрезал.
 */
export const NAME_LIMIT = limitFor('people.0.name')

function member(input: unknown, fallback: FaceVariant): FamilyMember | null {
  // Старый формат настроек — просто список лиц. Такие строки лежат в базе
  // с первой версии кабинета, и читать их надо, а не терять.
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

/**
 * Приводит к вменяемому виду что угодно: пришло оно из формы, из базы или из
 * старого формата. Границы те же, что у постера (`MIN_PEOPLE`..`MAX_PEOPLE`).
 */
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

/** Пустой бланк с нужными героями: от настройки едут только лица и имена. */
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
