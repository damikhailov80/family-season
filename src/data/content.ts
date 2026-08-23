import type { MoodRow, MoodValue, PersonProject, WeekCard } from '../types'

export const header = {
  title: 'Семейный сезон',
  ribbon: 'Наша жизнь. Наши приключения. Наши месяцы.',
}

export const monthTheme = {
  badge: '1. Тема месяца',
  month: 'Сентябрь',
  subtitle: 'Месяц Marvel',
  question: 'Что нам хочется почувствовать / попробовать в этом месяце?',
  answer: 'Больше приключений, смеха и классных моментов вместе!',
}

export const weeksSection = {
  badge: '2. Недели месяца',
  note: '4 недели – 4 идеи – 4 воспоминания',
}

export const weeks: WeekCard[] = [
  {
    title: 'Неделя 1',
    lines: ['Посмотреть', 'первый фильм', 'всей семьёй'],
    photoAlt: 'Киновечер дома: выключили свет и сделали попкорн',
    photoSrc: '/images/week1-movie-night.svg',
  },
  {
    title: 'Неделя 2',
    lines: ['Приготовить', 'пасту', 'как в фильме'],
    photoAlt: 'Паста с томатным соусом и базиликом, которую готовили вчетвером',
    photoSrc: '/images/week2-pasta.svg',
  },
  {
    title: 'Неделя 3',
    lines: ['Семейный вечер', 'Marvel', '(настолки)'],
    photoAlt: 'Фото недели 3',
  },
  {
    title: 'Неделя 4',
    lines: ['Что-нибудь', 'неожиданное!'],
    photoAlt: 'Фото недели 4',
  },
]

export const monthGoal = {
  badge: 'Наша цель на месяц',
  lines: ['Провести время вместе, создать крутые воспоминания', 'и попробовать что-то новое!'],
}

export const projectsSection = {
  badge: '3. Личные проекты',
  note: 'Наши личные цели и прогресс',
}

export const projects: PersonProject[] = [
  {
    role: 'Папа',
    face: 'dad',
    accent: 'blue',
    project: 'SpeakLike',
    description: ['Сделать первую рабочую', 'версию приложения'],
    monthGoal: 'Довести до работающего прототипа',
    percent: 40,
  },
  {
    role: 'Мама',
    face: 'mom',
    accent: 'pink',
    project: 'Йога и баланс',
    description: ['Регулярные тренировки', 'и больше времени для себя'],
    monthGoal: 'Практика 3 раза в неделю',
    percent: 60,
  },
  {
    role: 'Леша',
    face: 'son',
    accent: 'leaf',
    project: 'Робот из LEGO',
    description: ['Собрать и запрограммировать', 'своего робота'],
    monthGoal: 'Чтобы робот умел ездить и говорить',
    percent: 70,
  },
  {
    role: 'Лиза',
    face: 'daughter',
    accent: 'tangerine',
    project: 'Рисую комикс',
    description: ['Нарисовать свой первый', 'настоящий комикс'],
    monthGoal: 'Создать всех персонажей и историю',
    percent: 50,
  },
]

export const moodSection = {
  badge: '4. Настроение нашей семьи',
  legend: [
    { mood: 'good' as const, label: 'Хорошо' },
    { mood: 'ok' as const, label: 'Нормально' },
    { mood: 'bad' as const, label: 'Плохо' },
  ],
}

/** В сентябре 30 дней. */
export const DAYS_IN_MONTH = 30

/** Календарь заполняем по мере месяца — сейчас закрыто по 17-е число. */
export const FILLED_THROUGH_DAY = 17

const MOOD_CODES: Record<string, MoodValue> = {
  g: 'good',
  y: 'ok',
  r: 'bad',
  '.': null,
}

/**
 * Разворачивает компактный код ('ggy...') в массив ровно из DAYS_IN_MONTH значений.
 * Незаполненные дни в конце месяца остаются пустыми ячейками.
 */
export function parseMoodRow(code: string): MoodValue[] {
  const values = [...code].map((char) => MOOD_CODES[char] ?? null)
  return Array.from({ length: DAYS_IN_MONTH }, (_, index) =>
    index < FILLED_THROUGH_DAY ? (values[index] ?? null) : null,
  )
}

// g — хорошо, y — нормально, r — плохо. Ровно 17 символов: по одному на прожитый день.
export const moodRows: MoodRow[] = [
  {
    role: 'Папа',
    face: 'dad',
    accent: 'blue',
    values: parseMoodRow('ggyggygggyggyggyg'),
  },
  {
    role: 'Мама',
    face: 'mom',
    accent: 'pink',
    values: parseMoodRow('gygggyygggryggygg'),
  },
  {
    role: 'Леша',
    face: 'son',
    accent: 'leaf',
    values: parseMoodRow('ggggyggyggggyyggg'),
  },
  {
    role: 'Лиза',
    face: 'daughter',
    accent: 'tangerine',
    values: parseMoodRow('gyrggygggyryggygg'),
  },
]

export const monthSummary = {
  badge: 'Итоги месяца',
  question: 'Что уже запомнилось больше всего?',
  answer: 'Первый киновечер: выключили свет, сделали попкорн и никто ни разу не полез в телефон.',
}
