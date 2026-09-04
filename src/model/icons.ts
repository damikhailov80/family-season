import { ICON_SETS, ICON_SLOTS } from './icons.data'
import type { Lang } from './lang'
import type { IconName } from '../components/doodles/icons.generated'
import type { IconSetId } from '../types'

export type IconSlot = (typeof ICON_SLOTS)[number]

export const ICON_SET_ORDER: IconSetId[] = ICON_SETS.map(([id]) => id)

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

export const DEFAULT_ICON_SET: IconSetId = 'classic'

export function iconSetOrNull(value: unknown): IconSetId | null {
  return ICON_SET_ORDER.includes(value as IconSetId) ? (value as IconSetId) : null
}

export function knownIconSet(value: unknown): IconSetId {
  return iconSetOrNull(value) ?? DEFAULT_ICON_SET
}

export function randomIconSet(current: IconSetId): IconSetId {
  const others = ICON_SET_ORDER.filter((set) => set !== current)
  return others[Math.floor(Math.random() * others.length)]
}
