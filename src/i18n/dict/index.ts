import type { Lang } from '../../model/lang'
import type { Dict } from '../types'
import { ru } from './ru'
import { en } from './en'
import { pl } from './pl'

/**
 * Все три словаря разом. Импорт статический, а не `import()`: словарь читают и
 * серверные компоненты, и `generateMetadata`, и серверные действия, а в клиент
 * он едет пропом (см. `LangProvider`) — то есть в браузерный бандл этот модуль
 * не попадает вовсе, и делить его на куски незачем.
 */
export const DICTS: Record<Lang, Dict> = { ru, en, pl }
