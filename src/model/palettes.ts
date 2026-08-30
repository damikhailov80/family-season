import { PALETTES } from './palettes.data'
import type { Lang } from './lang'
import type { PaletteId } from '../types'

/**
 * Темы оформления постера. Сто наборов из подборки Canva «100 цветовых сочетаний»:
 * четыре краски на набор, ничего кроме них, чёрного и белого на листе нет.
 *
 * Состав и подписи собираются в `palettes.data.ts`, краски — в
 * `src/styles/palettes.css`; оба файла делает `tools/palettes/build.mjs`
 * из `tools/palettes/source.json` (`npm run palettes`). Здесь — только выбор темы.
 *
 * Тема печатается, но частью бланка не является: в ссылке её несёт отдельная
 * пометка `p=` (см. `readPaletteId` в `codec.ts`). Пометки нет — тема по умолчанию,
 * поэтому ссылки, разосланные до появления тем, открываются как прежде.
 */

export const PALETTE_ORDER: PaletteId[] = PALETTES.map(([id]) => id)

/**
 * Подписи тем на всех трёх языках: их видно на кнопке переключателя и в полосе
 * тем на лендинге, значит, они часть интерфейса и переводятся вместе с ним.
 * Собираются `tools/palettes/build.mjs` — руками их не правят.
 */
const LABELS = Object.fromEntries(PALETTES) as Record<PaletteId, Record<Lang, string>>

export function paletteLabel(palette: PaletteId, lang: Lang): string {
  return LABELS[palette][lang]
}

/** «Янтарь и лазурь» — тот же тёмно-синий с охрой, что и до появления ста тем. */
export const DEFAULT_PALETTE: PaletteId = 'amber-azure'

/**
 * id из ссылки мог написать кто угодно: неизвестный — как будто его нет.
 * `null` вместо подмены нужен там, где «темы нет» и «тема по умолчанию» — разные
 * случаи: параметр `p=` в адресе отсутствует ровно тогда, когда возвращается null.
 */
export function paletteOrNull(value: unknown): PaletteId | null {
  return PALETTE_ORDER.includes(value as PaletteId) ? (value as PaletteId) : null
}

/** То же, но для поля примера: у листа тема есть всегда. */
export function knownPalette(value: unknown): PaletteId {
  return paletteOrNull(value) ?? DEFAULT_PALETTE
}

/**
 * Следующая тема — случайная, а не соседняя по списку: сто наборов перебирать
 * по одному бессмысленно, а рядом стоящие часто похожи. Текущая исключается,
 * иначе клик иногда «ничего не делает».
 */
export function randomPalette(current: PaletteId): PaletteId {
  const others = PALETTE_ORDER.filter((palette) => palette !== current)
  return others[Math.floor(Math.random() * others.length)]
}
