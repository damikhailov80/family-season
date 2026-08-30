'use client'

import { createContext, useContext } from 'react'
import { DEFAULT_LANG, type Lang } from '../model/lang'
import type { Dict } from './types'
import { ru } from './dict/ru'

/**
 * Язык и словарь для клиентских компонентов.
 *
 * Контекст и хуки вынесены из файла провайдера по тому же правилу, что и
 * `docContext.ts`: oxlint не даёт экспортировать из файла с компонентом что-то
 * кроме компонентов (`react/only-export-components`).
 *
 * Значение по умолчанию настоящее, а не заглушка: клиентские кусочки бывают и
 * вне провайдера (тесты, изолированный рендер), и падать им незачем.
 */
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
