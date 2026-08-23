import demoFillRaw from '../data/demoFill.json'
import { normalizeFill } from './fill'
import type { FillState } from './types'

/**
 * Заполнение демо-листа: настроения, проценты и итоги месяца.
 * Живёт отдельным JSON, а не в шаблоне — в ссылку это состояние не едет.
 */
export const demoFill: FillState = normalizeFill(demoFillRaw)
