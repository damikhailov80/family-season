import { useCallback, useState } from 'react'
import { nextFace } from '../model/accents'
import { shiftMonth } from '../model/calendar'
import { templateDays } from '../model/fill'
import { limitFor } from '../model/limits'
import { normalizeFamily, type FamilyPreset } from '../model/family'
import { createPerson, nextPersonId } from '../model/templates'
import type { Template } from '../model/types'
import { MAX_PEOPLE, MIN_PEOPLE } from '../model/types'
import type { FieldBinding } from './docContext'

/**
 * Бланк и всё, что с ним делают руками. Ни адреса, ни базы, ни истории здесь
 * нет — только сам постер.
 *
 * Отдельным хуком, а не куском провайдера: правки бланка одинаковы везде, а
 * страниц, которые его ставят, три — черновик, свой сезон и чужой выложенный.
 * Разное у них только хранилище.
 */
export interface TemplateState {
  template: Template
  setTemplate: React.Dispatch<React.SetStateAction<Template>>
  days: number
  field: (path: string) => FieldBinding
  addPerson: () => void
  removePerson: (id: string) => void
  cycleFace: (id: string) => void
  replacePeople: (members: FamilyPreset) => void
  stepMonth: (delta: number) => void
}

/** Иммутабельная запись по пути 'people.0.name'. Документ маленький, клон дешёвый. */
function setByPath(template: Template, path: string, value: string): Template {
  const keys = path.split('.')
  const clone = structuredClone(template)
  let node = clone as unknown as Record<string, unknown>
  for (const key of keys.slice(0, -1)) {
    node = node[key] as Record<string, unknown>
  }
  node[keys[keys.length - 1]] = value
  return clone
}

function getByPath(template: Template, path: string): string {
  let node: unknown = template
  for (const key of path.split('.')) {
    node = (node as Record<string, unknown>)?.[key]
  }
  return typeof node === 'string' ? node : ''
}

export function useTemplateState(initial: Template): TemplateState {
  const [template, setTemplate] = useState<Template>(initial)

  const update = useCallback((recipe: (current: Template) => Template) => {
    setTemplate((current) => recipe(current))
  }, [])

  /*
   * Предел едет вместе с привязкой, поэтому секциям про него знать нечего: они и так
   * разворачивают `field(...)` в пропы. Обрезка здесь — сеть под саму модель: ввод
   * останавливает `EditableText`, но добраться до `onChange` можно и мимо него.
   */
  const field = useCallback(
    (path: string): FieldBinding => {
      const maxLength = limitFor(path)
      return {
        value: getByPath(template, path),
        maxLength,
        onChange: (value: string) =>
          setTemplate((current) => setByPath(current, path, value.slice(0, maxLength))),
      }
    },
    [template],
  )

  const addPerson = useCallback(
    () =>
      update((current) =>
        current.people.length >= MAX_PEOPLE
          ? current
          : {
              ...current,
              people: [...current.people, createPerson(nextPersonId(current.people), 'son')],
            },
      ),
    [update],
  )

  const removePerson = useCallback(
    (id: string) =>
      update((current) =>
        current.people.length <= MIN_PEOPLE
          ? current
          : { ...current, people: current.people.filter((person) => person.id !== id) },
      ),
    [update],
  )

  const cycleFace = useCallback(
    (id: string) =>
      update((current) => ({
        ...current,
        people: current.people.map((person) =>
          person.id === id ? { ...person, face: nextFace(person.face) } : person,
        ),
      })),
    [update],
  )

  /*
   * Замена состава на свой. Карточка на каждом месте берётся прежняя, и в ней
   * меняются ровно два поля — рисунок и имя. Проект, описание и цель остаются:
   * форкают ради идей, а меняют актёрский состав.
   *
   * Место, на котором карточки не было, заполняется пустой. Лишние отбрасываются
   * сами — длину задаёт `normalizeFamily`, она же держит границы 2..5 и режет
   * имена. Id пересобираем `p1..pN`: старый список выбрасывается целиком, поэтому
   * `nextPersonId` здесь не нужен. `templateForFamily` не годится — она вернула бы
   * весь пустой бланк и затёрла тему, недели и цель месяца.
   */
  const replacePeople = useCallback(
    (members: FamilyPreset) =>
      update((current) => ({
        ...current,
        people: normalizeFamily(members).map((member, index) => ({
          ...(current.people[index] ?? createPerson('', 'son')),
          id: `p${index + 1}`,
          face: member.face,
          name: member.name,
        })),
      })),
    [update],
  )

  const stepMonth = useCallback(
    (delta: number) =>
      update((current) => ({
        ...current,
        theme: { ...current.theme, ...shiftMonth(current.theme, delta) },
      })),
    [update],
  )

  return {
    template,
    setTemplate,
    days: templateDays(template),
    field,
    addPerson,
    removePerson,
    cycleFace,
    replacePeople,
    stepMonth,
  }
}
