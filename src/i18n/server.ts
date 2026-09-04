import { cache } from 'react'
import { lang as rootLang } from 'next/root-params'
import { knownLang, type Lang } from '../model/lang'
import { DICTS } from './dict'
import type { Dict } from './types'

/**
 * Язык берётся корневым параметром маршрута, поэтому его читает любой серверный
 * компонент без прокидывания пропом. В действиях и роут-хендлерах
 * `next/root-params` не работает — там язык едет аргументом.
 *
 * `cache()` из React можно, `unstable_cache` — нет: он бросает на корневых
 * параметрах.
 */
export const getLang = cache(async (): Promise<Lang> => knownLang(await rootLang()))

export const getDict = cache(async (): Promise<Dict> => DICTS[await getLang()])
