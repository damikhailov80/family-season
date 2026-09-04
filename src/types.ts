import type { ICON_SETS } from './model/icons.data'
import type { PALETTES } from './model/palettes.data'

/** Тем сто: союз собирается из реестра, а не переписывается руками. */
export type PaletteId = (typeof PALETTES)[number][0]

/** Как и тема, в бланк не входит: лежит колонкой рядом. */
export type IconSetId = (typeof ICON_SETS)[number][0]

/**
 * Слот темы под секцию: у каждого своя краска плашки, свой цвет текста на ней
 * и свой тёмный оттенок для рамки. Это роль, а не цвет: одно и то же `theme`
 * в одной теме сливовое, а в другой оливковое (см. `src/styles/tokens.css`).
 */
export type AccentSlot = 'deep' | 'theme' | 'weeks' | 'goal' | 'projects'

export type FaceVariant = 'dad' | 'mom' | 'son' | 'daughter'

export type MoodValue = 'good' | 'ok' | 'bad' | null
