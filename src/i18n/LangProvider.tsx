'use client'

import { langContext, type LangValue } from './context'

/**
 * Словарь приезжает в клиент **пропом с сервера**, а не импортом.
 *
 * Так в клиентском бандле не оказывается ни одного языка: в нагрузке страницы
 * едет ровно тот словарь, который нужен этому читателю. Импорт всех трёх (даже
 * с выбором по `switch`) утащил бы в браузер все три.
 */
export function LangProvider({
  value,
  children,
}: {
  value: LangValue
  children: React.ReactNode
}) {
  return <langContext.Provider value={value}>{children}</langContext.Provider>
}
