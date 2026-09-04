import { FACE_ORDER } from './accents'
import { pickTargetMonth } from './calendar'
import { limitFor } from './limits'
import type { Person, Template } from './types'
import { MAX_PEOPLE, MIN_PEOPLE, WEEKS_COUNT } from './types'

const ID_LIMIT = 8

export type PackedPerson = [
  id: string,
  name: string,
  face: number,
  project: string,
  description: string,
  goal: string,
]

export type Packed = [
  version: 2,
  header: [title: string, ribbon: string],
  theme: [year: number, monthIndex: number, subtitle: string, question: string],
  weeksNote: string,
  weeks: [title: string, text: string][],
  projectsNote: string,
  goal: string,
  people: PackedPerson[],
]

export function pack(template: Template): Packed {
  const { header, theme, weeks, people } = template
  return [
    2,
    [header.title, header.ribbon],
    [theme.year, theme.monthIndex, theme.subtitle, theme.question],
    template.weeksNote,
    weeks.map((week) => [week.title, week.text]),
    template.projectsNote,
    template.goal,
    people.map((person): PackedPerson => [
      person.id,
      person.name,
      Math.max(0, FACE_ORDER.indexOf(person.face)),
      person.project,
      person.description,
      person.goal,
    ]),
  ]
}

export function unpack(packed: Packed): Template {
  const [, header, theme, weeksNote, weeks, projectsNote, goal, people] = packed
  return normalizeTemplate({
    header: { title: header?.[0], ribbon: header?.[1] },
    theme: {
      year: theme?.[0],
      monthIndex: theme?.[1],
      subtitle: theme?.[2],
      question: theme?.[3],
    },
    weeksNote,
    weeks: weeks?.map((week) => ({ title: week?.[0], text: week?.[1] })),
    projectsNote,
    goal,
    people: people?.map((person) => ({
      id: person?.[0],
      name: person?.[1],
      face: FACE_ORDER[person?.[2]],
      project: person?.[3],
      description: person?.[4],
      goal: person?.[5],
    })),
  })
}

function text(value: unknown, limit: number, fallback = ''): string {
  if (typeof value !== 'string') return fallback
  return value.replace(/\s*\n+\s*/g, ' ').slice(0, limit)
}

function int(value: unknown, fallback: number, min: number, max: number): number {
  const parsed = typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : fallback
  return Math.min(max, Math.max(min, parsed))
}

export function normalizeTemplate(input: unknown): Template {
  const raw = (input ?? {}) as Record<string, unknown>
  const header = (raw.header ?? {}) as Record<string, unknown>
  const theme = (raw.theme ?? {}) as Record<string, unknown>
  const fallbackMonth = pickTargetMonth()

  const weeks = Array.isArray(raw.weeks) ? raw.weeks : []
  const people = Array.isArray(raw.people) ? raw.people : []

  const normalizedPeople = people.slice(0, MAX_PEOPLE).map((item, index): Person => {
    const person = (item ?? {}) as Record<string, unknown>
    const face = FACE_ORDER.includes(person.face as Person['face'])
      ? (person.face as Person['face'])
      : FACE_ORDER[index % FACE_ORDER.length]
    return {
      id: text(person.id, ID_LIMIT, `p${index + 1}`) || `p${index + 1}`,
      name: text(person.name, limitFor('people.*.name')),
      face,
      project: text(person.project, limitFor('people.*.project')),
      description: text(person.description, limitFor('people.*.description')),
      goal: text(person.goal, limitFor('people.*.goal')),
    }
  })

  while (normalizedPeople.length < MIN_PEOPLE) {
    const index = normalizedPeople.length
    normalizedPeople.push({
      id: `p${index + 1}`,
      name: '',
      face: FACE_ORDER[index % FACE_ORDER.length],
      project: '',
      description: '',
      goal: '',
    })
  }

  return {
    header: {
      title: text(header.title, limitFor('header.title')),
      ribbon: text(header.ribbon, limitFor('header.ribbon')),
    },
    theme: {
      year: int(theme.year, fallbackMonth.year, 1970, 3000),
      monthIndex: int(theme.monthIndex, fallbackMonth.monthIndex, 0, 11),
      subtitle: text(theme.subtitle, limitFor('theme.subtitle')),
      question: text(theme.question, limitFor('theme.question')),
    },
    weeksNote: text(raw.weeksNote, limitFor('weeksNote')),
    weeks: Array.from({ length: WEEKS_COUNT }, (_, index) => {
      const week = (weeks[index] ?? {}) as Record<string, unknown>
      return {
        title: text(week.title, limitFor('weeks.*.title')),
        text: text(week.text, limitFor('weeks.*.text')),
      }
    }),
    projectsNote: text(raw.projectsNote, limitFor('projectsNote')),
    goal: text(raw.goal, limitFor('goal')),
    people: normalizedPeople,
  }
}
