import { PALETTES } from './palettes.data'
import type { Lang } from './lang'
import type { PaletteId } from '../types'

export const PALETTE_ORDER: PaletteId[] = PALETTES.map(([id]) => id)

const LABELS = Object.fromEntries(PALETTES) as Record<PaletteId, Record<Lang, string>>

export function paletteLabel(palette: PaletteId, lang: Lang): string {
  return LABELS[palette][lang]
}

export const DEFAULT_PALETTE: PaletteId = 'amber-azure'

export function paletteOrNull(value: unknown): PaletteId | null {
  return PALETTE_ORDER.includes(value as PaletteId) ? (value as PaletteId) : null
}

export function knownPalette(value: unknown): PaletteId {
  return paletteOrNull(value) ?? DEFAULT_PALETTE
}

export function randomPalette(current: PaletteId): PaletteId {
  const others = PALETTE_ORDER.filter((palette) => palette !== current)
  return others[Math.floor(Math.random() * others.length)]
}
