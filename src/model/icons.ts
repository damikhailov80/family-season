import { ICON_SETS, ICON_SLOTS } from './icons.data'
import type { Lang } from './lang'
import type { IconName } from '../components/doodles/icons.generated'
import type { IconSetId } from '../types'

/**
 * Состав и подписи собираются в `icons.data.ts`, геометрия — в
 * `icons.generated.ts` (`npm run icons`); здесь только выбор набора. Набор, как и
 * тема, печатается, но частью бланка не является.
 */

/** Слот — место в макете постера, а не рисунок. */
export type IconSlot = (typeof ICON_SLOTS)[number]

export const ICON_SET_ORDER: IconSetId[] = ICON_SETS.map(([id]) => id)

/** Подписи видно на кнопке переключателя, значит, они переводятся. */
const LABELS = Object.fromEntries(ICON_SETS.map(([id, label]) => [id, label])) as Record<
  IconSetId,
  Record<Lang, string>
>

export function iconSetLabel(iconSet: IconSetId, lang: Lang): string {
  return LABELS[iconSet][lang]
}

export const ICON_SET_ICONS: Record<IconSetId, Record<IconSlot, IconName>> = Object.fromEntries(
  ICON_SETS.map(([id, , slots]) => [id, slots]),
) as Record<IconSetId, Record<IconSlot, IconName>>

/** «Классика» — те же рисунки, что были на постере до появления наборов. */
export const DEFAULT_ICON_SET: IconSetId = 'classic'

/** `null` вместо подмены: «набора нет» и «набор по умолчанию» — разные случаи. */
export function iconSetOrNull(value: unknown): IconSetId | null {
  return ICON_SET_ORDER.includes(value as IconSetId) ? (value as IconSetId) : null
}

/** То же там, где набор есть всегда: колонка строки, поле примера. */
export function knownIconSet(value: unknown): IconSetId {
  return iconSetOrNull(value) ?? DEFAULT_ICON_SET
}

/** Следующий набор — случайный другой, по тем же причинам, что и у тем. */
export function randomIconSet(current: IconSetId): IconSetId {
  const others = ICON_SET_ORDER.filter((set) => set !== current)
  return others[Math.floor(Math.random() * others.length)]
}
