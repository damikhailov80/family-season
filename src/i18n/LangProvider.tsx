'use client'

import { langContext, type LangValue } from './context'

/**
 * Словарь приезжает пропом с сервера, а не импортом: так в клиентском бандле не
 * оказывается ни одного языка — импорт даже с выбором по `switch` утащил бы все
 * три.
 */
export function LangProvider({ value, children }: { value: LangValue; children: React.ReactNode }) {
  return <langContext.Provider value={value}>{children}</langContext.Provider>
}
