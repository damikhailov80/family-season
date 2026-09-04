import type { Lang } from '../../model/lang'
import type { Dict } from '../types'
import { ru } from './ru'
import { en } from './en'
import { pl } from './pl'

export const DICTS: Record<Lang, Dict> = { ru, en, pl }
