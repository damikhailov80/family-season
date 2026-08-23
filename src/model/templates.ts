import { pickTargetMonth } from './calendar'
import type { Person, Template } from './types'
import { WEEKS_COUNT } from './types'

/**
 * Демо-лист главной страницы. Месяц не зашит в текст: он подставляется
 * автоматически от сегодняшней даты, чтобы пример никогда не «протухал».
 */
export function createDemoTemplate(): Template {
  return {
    header: {
      title: 'Семейный сезон',
      ribbon: 'Наша жизнь. Наши приключения. Наши месяцы.',
    },
    theme: {
      ...pickTargetMonth(),
      subtitle: 'Месяц Marvel',
      question: 'Что уже запомнилось больше всего?',
    },
    weeksNote: '4 недели – 4 идеи – 4 воспоминания',
    weeks: [
      { title: 'Неделя 1', text: 'Посмотреть\nпервый фильм\nвсей семьёй' },
      { title: 'Неделя 2', text: 'Приготовить\nпасту\nкак в фильме' },
      { title: 'Неделя 3', text: 'Семейный вечер\nMarvel\n(настолки)' },
      { title: 'Неделя 4', text: 'Что-нибудь\nнеожиданное!' },
    ],
    projectsNote: 'Наши личные цели и прогресс',
    goal: 'Провести время вместе, создать крутые воспоминания\nи попробовать что-то новое!',
    people: [
      {
        id: 'p1',
        name: 'Папа',
        face: 'dad',
        project: 'SpeakLike',
        description: 'Сделать первую рабочую\nверсию приложения',
        goal: 'Довести до работающего прототипа',
      },
      {
        id: 'p2',
        name: 'Мама',
        face: 'mom',
        project: 'Йога и баланс',
        description: 'Регулярные тренировки\nи больше времени для себя',
        goal: 'Практика 3 раза в неделю',
      },
      {
        id: 'p3',
        name: 'Леша',
        face: 'son',
        project: 'Робот из LEGO',
        description: 'Собрать и запрограммировать\nсвоего робота',
        goal: 'Чтобы робот умел ездить и говорить',
      },
      {
        id: 'p4',
        name: 'Лиза',
        face: 'daughter',
        project: 'Рисую комикс',
        description: 'Нарисовать свой первый\nнастоящий комикс',
        goal: 'Создать всех персонажей и историю',
      },
    ],
  }
}

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
