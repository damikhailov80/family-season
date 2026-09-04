import type { ICON_SETS } from './model/icons.data'
import type { PALETTES } from './model/palettes.data'

export type PaletteId = (typeof PALETTES)[number][0]

export type IconSetId = (typeof ICON_SETS)[number][0]

export type AccentSlot = 'deep' | 'theme' | 'weeks' | 'goal' | 'projects'

export type FaceVariant = 'dad' | 'mom' | 'son' | 'daughter'

export type MoodValue = 'good' | 'ok' | 'bad' | null
