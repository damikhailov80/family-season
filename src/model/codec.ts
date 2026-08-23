import { FACE_ORDER } from './accents'
import { pickTargetMonth } from './calendar'
import type { Person, Template } from './types'
import { MAX_PEOPLE, MIN_PEOPLE, WEEKS_COUNT } from './types'

/**
 * Шаблон целиком живёт в адресной строке: #d=<версия><упаковка>.
 *
 * Порядок: компактный позиционный массив -> JSON -> deflate-raw -> base64url.
 * Имена полей в ссылку не едут, поэтому пример укладывается примерно в 700 байт.
 *
 *   2z — сжато (CompressionStream есть в браузере)
 *   2p — тот же JSON без сжатия (запасной путь для старых браузеров)
 *
 * Формат 1 читается тоже: в нём у темы месяца был собственный ответ, а у итогов
 * отдельный вопрос. Оба поля ушли — ответ стал слоем заполнения, а последняя
 * секция превратилась в «Идеи на следующий месяц» без вопроса.
 */

const HASH_PARAM = 'd'
const PACKED = '2z'
const PLAIN = '2p'
const PACKED_V1 = '1z'
const PLAIN_V1 = '1p'

const MAX_TEXT = 400

type PackedPerson = [id: string, name: string, face: number, project: string, description: string, goal: string]

type Packed = [
  version: 2,
  header: [title: string, ribbon: string],
  theme: [year: number, monthIndex: number, subtitle: string, question: string],
  weeksNote: string,
  weeks: [title: string, text: string][],
  projectsNote: string,
  goal: string,
  people: PackedPerson[],
]

function pack(template: Template): Packed {
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

/** Позиции полей совпадают у обоих форматов — лишние хвосты просто игнорируются. */
function unpack(packed: Packed): Template {
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

function text(value: unknown, fallback = ''): string {
  if (typeof value !== 'string') return fallback
  return value.slice(0, MAX_TEXT)
}

function int(value: unknown, fallback: number, min: number, max: number): number {
  const parsed = typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : fallback
  return Math.min(max, Math.max(min, parsed))
}

/** Приводит что угодно к корректному шаблону: ссылку мог поправить кто угодно. */
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
      id: text(person.id, `p${index + 1}`).slice(0, 8) || `p${index + 1}`,
      name: text(person.name),
      face,
      project: text(person.project),
      description: text(person.description),
      goal: text(person.goal),
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
      title: text(header.title, 'Семейный сезон'),
      ribbon: text(header.ribbon),
    },
    theme: {
      year: int(theme.year, fallbackMonth.year, 1970, 3000),
      monthIndex: int(theme.monthIndex, fallbackMonth.monthIndex, 0, 11),
      subtitle: text(theme.subtitle),
      question: text(theme.question, 'Что уже запомнилось больше всего?'),
    },
    weeksNote: text(raw.weeksNote),
    weeks: Array.from({ length: WEEKS_COUNT }, (_, index) => {
      const week = (weeks[index] ?? {}) as Record<string, unknown>
      return { title: text(week.title, `Неделя ${index + 1}`), text: text(week.text) }
    }),
    projectsNote: text(raw.projectsNote),
    goal: text(raw.goal),
    people: normalizedPeople,
  }
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
}

function fromBase64Url(value: string): Uint8Array {
  const base64 = value.replaceAll('-', '+').replaceAll('_', '/')
  const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='))
  return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

async function through(bytes: Uint8Array, stream: GenericTransformStream) {
  const blob = new Blob([bytes as BlobPart])
  const buffer = await new Response(blob.stream().pipeThrough(stream)).arrayBuffer()
  return new Uint8Array(buffer)
}

export async function encodeTemplate(template: Template): Promise<string> {
  const json = JSON.stringify(pack(template))
  const bytes = new TextEncoder().encode(json)
  if (typeof CompressionStream === 'undefined') return PLAIN + toBase64Url(bytes)
  const deflated = await through(bytes, new CompressionStream('deflate-raw'))
  return PACKED + toBase64Url(deflated)
}

export async function decodeTemplate(payload: string): Promise<Template | null> {
  try {
    const version = payload.slice(0, 2)
    const body = payload.slice(2)
    const known = [PACKED, PLAIN, PACKED_V1, PLAIN_V1]
    if (!known.includes(version)) return null

    let bytes = fromBase64Url(body)
    if (version === PACKED || version === PACKED_V1) {
      bytes = await through(bytes, new DecompressionStream('deflate-raw'))
    }
    const parsed = JSON.parse(new TextDecoder().decode(bytes)) as Packed
    if (!Array.isArray(parsed) || (parsed[0] !== 2 && (parsed[0] as number) !== 1)) return null
    return unpack(parsed)
  } catch {
    // Битую ссылку не чиним и не роняем приложение — показываем демо.
    return null
  }
}

export function readHashPayload(hash: string = location.hash): string | null {
  const params = new URLSearchParams(hash.replace(/^#/, ''))
  return params.get(HASH_PARAM)
}

export function hashFor(payload: string): string {
  return `#${HASH_PARAM}=${payload}`
}
