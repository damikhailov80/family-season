import demo1 from '../data/fills/demo-1.json'
import { normalizeFill } from './fill'
import type { FillState } from './types'
import { EMPTY_FILL } from './types'

/**
 * Готовые наборы заполнения для примеров: настроения, проценты, итоги и идеи.
 * В ссылку едет только id набора (`data=demo-1`) — сами данные лежат здесь, в
 * репозитории, и слоя `Template` не касаются.
 *
 * Шаблон примера в реестре не хранится: он приезжает в `d=`, а для первого примера
 * его делает `createDemoTemplate()` (месяц там считается от «сегодня», поэтому
 * зашивать шаблон в JSON нельзя). Новый пример — новый файл рядом и строка ниже.
 */
const FILLS: Record<string, FillState> = {
  'demo-1': normalizeFill(demo1),
}

export const DEFAULT_FILL_ID = 'demo-1'

/** id из адреса мог написать кто угодно: неизвестный — как будто его нет. */
export function knownFillId(id: string | null | undefined): string | null {
  return id && id in FILLS ? id : null
}

export function fillById(id: string | null): FillState {
  return (id && FILLS[id]) ?? EMPTY_FILL
}
