import { pickTargetMonth } from './calendar'
import type { Person, Template } from './types'
import { WEEKS_COUNT } from './types'

/** Пустой лист «с нуля»: каркас формы есть, содержимое вписывает пользователь. */
export function createEmptyTemplate(): Template {
  return {
    header: { title: 'Семейный сезон', ribbon: '' },
    theme: {
      ...pickTargetMonth(),
      subtitle: '',
      question: 'Что уже запомнилось больше всего?',
    },
    weeksNote: '4 недели – 4 идеи – 4 воспоминания',
    weeks: Array.from({ length: WEEKS_COUNT }, (_, index) => ({
      title: `Неделя ${index + 1}`,
      text: '',
    })),
    projectsNote: 'Наши личные цели и прогресс',
    goal: '',
    people: [createPerson('p1', 'dad'), createPerson('p2', 'mom')],
  }
}

export function createPerson(id: string, face: Person['face']): Person {
  return { id, name: '', face, project: '', description: '', goal: '' }
}

/** Следующий свободный id вида p7 — ids людей должны быть уникальны в листе. */
export function nextPersonId(people: Person[]): string {
  const used = new Set(people.map((person) => person.id))
  for (let index = 1; ; index += 1) {
    const id = `p${index}`
    if (!used.has(id)) return id
  }
}
