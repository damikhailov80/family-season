import { cache } from 'react'
import { lang as rootLang } from 'next/root-params'
import { knownLang, type Lang } from '../model/lang'
import { DICTS } from './dict'
import type { Dict } from './types'

export const getLang = cache(async (): Promise<Lang> => knownLang(await rootLang()))

export const getDict = cache(async (): Promise<Dict> => DICTS[await getLang()])
