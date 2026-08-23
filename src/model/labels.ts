/**
 * Постоянные подписи бланка. Это каркас формы, а не содержимое листа:
 * они одинаковы у всех, не редактируются и не попадают в URL.
 */
export const LABELS = {
  theme: '1. Тема месяца',
  /** Подпись рамки внутри темы месяца — там пишут итоги. */
  themeSummary: 'Итоги месяца',
  weeks: '2. Недели месяца',
  goal: 'Наша цель на месяц',
  projects: '3. Личные проекты',
  mood: '4. Настроение нашей семьи',
  nextIdeas: 'Идеи на следующий месяц',
  fieldProject: 'Проект:',
  fieldProgress: 'Прогресс',
  fieldGoal: 'Моя цель месяца:',
  moodWho: 'Кто',
  moodCaption: 'Настроение каждого члена семьи по дням месяца',
} as const

export const MOOD_LEGEND = [
  { mood: 'good' as const, label: 'Хорошо' },
  { mood: 'ok' as const, label: 'Нормально' },
  { mood: 'bad' as const, label: 'Плохо' },
]

/** Подсказки в пустых полях — видны только на экране в режиме правки. */
export const PLACEHOLDERS = {
  title: 'Название листа',
  ribbon: 'Девиз семьи',
  subtitle: 'Тема месяца',
  question: 'Вопрос',
  weeksNote: 'Подпись к неделям',
  weekTitle: 'Неделя',
  weekText: 'Что делаем на этой неделе',
  goal: 'Общая цель на месяц',
  projectsNote: 'Подпись к проектам',
  name: 'Имя',
  project: 'Название проекта',
  description: 'Описание проекта',
  personGoal: 'Цель на месяц',
} as const
