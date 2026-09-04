import { pickTargetMonth } from './calendar'
import type { Person, Template } from './types'
import { WEEKS_COUNT } from './types'

/**
 * Поля пустые буквально все, включая название: пустое поле показывает и печатает
 * свою подсказку из словаря, и второй копии этих текстов здесь быть не должно.
 */
export function createEmptyTemplate(): Template {
  return {
    header: { title: '', ribbon: '' },
    theme: { ...pickTargetMonth(), subtitle: '', question: '' },
    weeksNote: '',
    weeks: Array.from({ length: WEEKS_COUNT }, () => ({ title: '', text: '' })),
    projectsNote: '',
    goal: '',
    people: [createPerson('p1', 'dad'), createPerson('p2', 'mom')],
  }
}

export function createPerson(id: string, face: Person['face']): Person {
  return { id, name: '', face, project: '', description: '', goal: '' }
}

/** Id людей должны быть уникальны в листе. */
export function nextPersonId(people: Person[]): string {
  const used = new Set(people.map((person) => person.id))
  for (let index = 1; ; index += 1) {
    const id = `p${index}`
    if (!used.has(id)) return id
  }
}
