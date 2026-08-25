import type { PaletteId } from '../types'

/**
 * Темы оформления листа. Каждую задают две краски, `--primary` и `--secondary`;
 * они и весь вывод остальных цветов живут только в CSS (`src/styles/tokens.css`,
 * блоки `[data-palette='…']`) — здесь лишь состав набора, порядок в переключателе
 * и подписи.
 *
 * Тема печатается, но частью бланка не является: в ссылке её несёт отдельная
 * пометка `p=` (см. `readPaletteId` в `codec.ts`). «Классика» — тема по умолчанию:
 * пометки нет — значит она, и ссылки, разосланные до появления тем, выглядят
 * ровно как раньше.
 */

export const PALETTE_ORDER: PaletteId[] = ['classic', 'garnet', 'jungle', 'midnight', 'coal']

export const PALETTE_LABELS: Record<PaletteId, string> = {
  classic: 'Классика',
  garnet: 'Гранат',
  jungle: 'Джунгли',
  midnight: 'Полночь',
  coal: 'Уголь',
}

export const DEFAULT_PALETTE: PaletteId = 'classic'

/**
 * id из ссылки мог написать кто угодно: неизвестный — как будто его нет.
 * `null` вместо подмены нужен там, где «темы нет» и «тема по умолчанию» — разные
 * случаи: параметр `p=` в адресе отсутствует ровно тогда, когда возвращается null.
 */
export function paletteOrNull(value: unknown): PaletteId | null {
  return PALETTE_ORDER.includes(value as PaletteId) ? (value as PaletteId) : null
}

/** То же, но для поля шаблона: у листа тема есть всегда. */
export function knownPalette(value: unknown): PaletteId {
  return paletteOrNull(value) ?? DEFAULT_PALETTE
}
