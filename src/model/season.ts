import { pickTargetMonth } from './calendar'
import { posterText } from './labels'
import type { Lang } from './lang'
import { pack, unpack, type Packed, type PackedPerson } from './codec'
import type { Template } from './types'

/**
 * Как сезон лежит в базе: контент отдельно, имена отдельно.
 *
 * `content` — это вывод `pack()` из `codec.ts`, то есть ровно тот формат, в
 * котором бланк всегда и жил. Второй копии состояния не появляется: разбирает
 * его по-прежнему один `codec.ts`, а колонок «месяц» или «тема» рядом нет.
 *
 * Имена людей вынуты из контента, и это не оформление хранилища, а требование
 * продукта. По контенту считается уникальность публикации: сезон, у которого
 * поменяли только имена, — тот же самый сезон, и выложить его вторым нельзя.
 * Оттуда же берётся обезличивание: чтобы спрятать имена при публикации, надо
 * подменить ровно `names`, ничего не трогая в самом бланке.
 *
 * Файл намеренно без серверных зависимостей: им пользуются и страницы, и
 * скрипты посева, и запись в базу.
 */

export interface StoredSeason {
  /** `pack(template)` с пустыми именами. */
  content: Packed
  /** Имена по порядку `people`; длина совпадает с числом людей в контенте. */
  names: string[]
}

/** Бланк → то, что кладётся в строку. */
export function splitSeason(template: Template): StoredSeason {
  const content = pack(template)
  const names = content[7].map((person) => person[1])
  content[7] = content[7].map((person) => blankName(person))
  return { content, names }
}

/**
 * Строка → бланк. Имена вписываются **до** разбора, а не после: тогда их режет
 * та же `normalizeTemplate`, что и всё остальное. В базе лежит то, что когда-то
 * пришло из браузера, и доверять ему на слово незачем.
 */
export function joinSeason(content: unknown, names: unknown): Template {
  const packed = (Array.isArray(content) ? [...content] : []) as Packed
  const list = Array.isArray(names) ? names : []
  const people = Array.isArray(packed[7]) ? packed[7] : []

  packed[7] = people.map((person, index) => {
    const row = blankName(person)
    row[1] = typeof list[index] === 'string' ? list[index] : ''
    return row
  })
  return unpack(packed)
}

/** Копия строки человека с пустым именем; порченую строку из базы не разбираем. */
function blankName(person: unknown): PackedPerson {
  const row = (Array.isArray(person) ? [...person] : []) as PackedPerson
  row[1] = ''
  return row
}

/**
 * Месяц «сегодняшний», а не тот, что лежит в строке. Нужно системным сезонам —
 * нашим примерам: у них в базе месяц заморожен, как у всех, и к следующему году
 * пример звал бы собирать сентябрь позапрошлого года. Людские сезоны, наоборот,
 * показывают ровно свой месяц: он часть содержимого.
 */
export function withTargetMonth(template: Template): Template {
  return { ...template, theme: { ...template.theme, ...pickTargetMonth() } }
}

/**
 * Случайные имена вместо своих — для тех, кто выкладывает сезон, но не хочет
 * показывать семью. Подменяются ровно `names`: бланк от этого не меняется, и на
 * уникальность публикации замена не влияет (имена в сравнении не участвуют).
 *
 * Имена берутся из словаря языка **сезона** и без повторов: две «Ани» в одной
 * семье читались бы как ошибка, а не как анонимность, а русские имена в
 * польском сезоне выдавали бы не то, что человек прятал.
 */
export function anonymousNames(count: number, lang: Lang): string[] {
  const pool = [...posterText(lang).anonNames]
  return Array.from({ length: count }, () => {
    const index = Math.floor(Math.random() * pool.length)
    return pool.splice(index, 1)[0] ?? ''
  })
}
