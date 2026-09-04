import { PALETTES } from './palettes.data'
import type { Lang } from './lang'
import type { PaletteId } from '../types'

/**
 * Состав и подписи собираются в `palettes.data.ts`, краски — в `palettes.css`
 * (`npm run palettes`); здесь только выбор темы.
 *
 * Тема печатается, но частью бланка не является: она лежит колонкой рядом, а в
 * адресе выложенного сезона её несёт пометка `p=`.
 */

export const PALETTE_ORDER: PaletteId[] = PALETTES.map(([id]) => id)

/** Подписи видно на кнопке переключателя, значит, они переводятся. */
const LABELS = Object.fromEntries(PALETTES) as Record<PaletteId, Record<Lang, string>>

export function paletteLabel(palette: PaletteId, lang: Lang): string {
  return LABELS[palette][lang]
}

/** «Янтарь и лазурь» — тот же тёмно-синий с охрой, что и до появления ста тем. */
export const DEFAULT_PALETTE: PaletteId = 'amber-azure'

/** `null` вместо подмены: «темы нет» и «тема по умолчанию» — разные случаи. */
export function paletteOrNull(value: unknown): PaletteId | null {
  return PALETTE_ORDER.includes(value as PaletteId) ? (value as PaletteId) : null
}

/** То же там, где тема есть всегда: колонка строки, поле примера. */
export function knownPalette(value: unknown): PaletteId {
  return paletteOrNull(value) ?? DEFAULT_PALETTE
}

/**
 * Случайная, а не соседняя: сто наборов перебирать по одному бессмысленно, а
 * рядом стоящие часто похожи. Текущая исключается, иначе клик иногда «ничего
 * не делает».
 */
export function randomPalette(current: PaletteId): PaletteId {
  const others = PALETTE_ORDER.filter((palette) => palette !== current)
  return others[Math.floor(Math.random() * others.length)]
}
