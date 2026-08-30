import { ICON_SETS, ICON_SLOTS } from './icons.data'
import type { Lang } from './lang'
import type { IconName } from '../components/doodles/icons.generated'
import type { IconSetId } from '../types'

/**
 * Наборы рисунков постера. Двадцать наборов по восемь рисунков; библиотека —
 * сорок рисунков, и один и тот же рисунок стоит в разных наборах.
 *
 * Состав и подписи собираются в `icons.data.ts`, геометрия — в
 * `src/components/doodles/icons.generated.ts`; оба файла делает
 * `tools/icons/build.mjs` (`npm run icons`) из `tools/icons/source.json`.
 * Здесь — только выбор набора.
 *
 * Набор печатается, но частью бланка не является: в ссылке его несёт отдельная
 * пометка `i=` (см. `readIconSetId` в `codec.ts`), ровно как тему несёт `p=`.
 * Пометки нет — набор по умолчанию, то есть сегодняшние рисунки, поэтому
 * ссылки, разосланные до появления наборов, открываются как прежде.
 */

/** Место в макете постера: не рисунок, а дырка под него. */
export type IconSlot = (typeof ICON_SLOTS)[number]

export const ICON_SET_ORDER: IconSetId[] = ICON_SETS.map(([id]) => id)

/**
 * Подписи наборов на всех трёх языках — по той же причине, что и у тем: их
 * видно на кнопке переключателя. Собираются `tools/icons/build.mjs`.
 */
const LABELS = Object.fromEntries(ICON_SETS.map(([id, label]) => [id, label])) as Record<
  IconSetId,
  Record<Lang, string>
>

export function iconSetLabel(iconSet: IconSetId, lang: Lang): string {
  return LABELS[iconSet][lang]
}

/** Раздача рисунков по слотам: этим и отличается один набор от другого. */
export const ICON_SET_ICONS: Record<IconSetId, Record<IconSlot, IconName>> = Object.fromEntries(
  ICON_SETS.map(([id, , slots]) => [id, slots]),
) as Record<IconSetId, Record<IconSlot, IconName>>

/** «Классика» — те же рисунки, что были на постере до появления наборов. */
export const DEFAULT_ICON_SET: IconSetId = 'classic'

/**
 * id из ссылки мог написать кто угодно: неизвестный — как будто его нет.
 * `null` вместо подмены нужен там, где «набора нет» и «набор по умолчанию» —
 * разные случаи: пометка `i=` отсутствует ровно тогда, когда возвращается null.
 */
export function iconSetOrNull(value: unknown): IconSetId | null {
  return ICON_SET_ORDER.includes(value as IconSetId) ? (value as IconSetId) : null
}

/** То же, но для поля примера: у постера набор есть всегда. */
export function knownIconSet(value: unknown): IconSetId {
  return iconSetOrNull(value) ?? DEFAULT_ICON_SET
}

/** Следующий набор — случайный другой, по тем же причинам, что и у тем. */
export function randomIconSet(current: IconSetId): IconSetId {
  const others = ICON_SET_ORDER.filter((set) => set !== current)
  return others[Math.floor(Math.random() * others.length)]
}
