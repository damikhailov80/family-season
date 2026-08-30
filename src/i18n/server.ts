import { cache } from 'react'
import { lang as rootLang } from 'next/root-params'
import { knownLang, type Lang } from '../model/lang'
import { DICTS } from './dict'
import type { Dict } from './types'

/**
 * Язык и словарь для серверных компонентов.
 *
 * Берутся из **корневого параметра** маршрута: `[lang]` стоит выше корневого
 * лейаута, поэтому его читает любой серверный компонент без прокидывания пропом.
 *
 * В серверных действиях и роут-хендлерах `next/root-params` не работает — там
 * язык едет аргументом. Это не досадное ограничение, а следствие: у действия
 * маршрута нет, оно приходит из браузера.
 *
 * `cache()` из React можно, `unstable_cache` — нет: он бросает на корневых
 * параметрах.
 */
export const getLang = cache(async (): Promise<Lang> => knownLang(await rootLang()))

export const getDict = cache(async (): Promise<Dict> => DICTS[await getLang()])
