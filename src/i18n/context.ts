'use client'

import { createContext, useContext } from 'react'
import { DEFAULT_LANG, type Lang } from '../model/lang'
import type { Dict } from './types'
import { ru } from './dict/ru'

export interface LangValue {
  lang: Lang
  dict: Dict
}

export const langContext = createContext<LangValue>({ lang: DEFAULT_LANG, dict: ru })

export function useLang(): Lang {
  return useContext(langContext).lang
}

export function useDict(): Dict {
  return useContext(langContext).dict
}
