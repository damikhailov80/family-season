'use client'

import { langContext, type LangValue } from './context'

export function LangProvider({ value, children }: { value: LangValue; children: React.ReactNode }) {
  return <langContext.Provider value={value}>{children}</langContext.Provider>
}
