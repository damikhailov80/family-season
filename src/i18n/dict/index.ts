import type { Lang } from '../../model/lang'
import type { Dict } from '../types'
import { ru } from './ru'
import { en } from './en'
import { pl } from './pl'

/**
 * Импорт статический, а не `import()`: в браузерный бандл модуль не попадает
 * вовсе — в клиент словарь едет пропом (см. `LangProvider`).
 */
export const DICTS: Record<Lang, Dict> = { ru, en, pl }
