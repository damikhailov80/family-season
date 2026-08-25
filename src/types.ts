/**
 * Примитивы оформления. Структура листа описана в `src/model/types.ts`.
 */

/** Пять тем оформления листа; реестр — `src/model/palettes.ts`. */
export type PaletteId = 'classic' | 'garnet' | 'jungle' | 'midnight' | 'coal'

/**
 * Слот палитры под цветную плашку секции. Это роль, а не цвет: одно и то же
 * `theme` в «Классике» сливовое, а в «Гранате» оливковое (см. `src/styles/tokens.css`).
 */
export type AccentSlot = 'deep' | 'theme' | 'weeks' | 'goal' | 'projects'

export type FaceVariant = 'dad' | 'mom' | 'son' | 'daughter'

export type MoodValue = 'good' | 'ok' | 'bad' | null
