'use client'

import { useEffect, useState } from 'react'
import { normalizeFamily, type FamilyPreset } from '../model/family'

/**
 * Состав семьи из кабинета — для кнопки «Подставить свою семью».
 *
 * Спрашиваем только когда `enabled`, то есть в режиме правки: в просмотре и на
 * примере подставлять некуда, и лишний запрос там ни к чему.
 *
 * Любая беда — сеть, отсутствие сессии, молчащая база — это `null`, а не ошибка:
 * лист обязан работать без сервера, это его главное свойство. Молчание сервера
 * значит ровно одно — кнопки не будет.
 */
export function useFamilyPreset(enabled: boolean): FamilyPreset | null {
  const [family, setFamily] = useState<FamilyPreset | null>(null)

  useEffect(() => {
    if (!enabled) return
    const abort = new AbortController()
    fetch('/api/family', { signal: abort.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        // Пришло из сети — доверять нельзя, гоним через ту же нормализацию.
        setFamily(data?.family ? normalizeFamily(data.family) : null)
      })
      .catch(() => setFamily(null))
    return () => abort.abort()
  }, [enabled])

  return family
}
